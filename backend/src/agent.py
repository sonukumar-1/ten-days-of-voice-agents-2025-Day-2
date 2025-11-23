import json
import logging
import traceback
from dotenv import load_dotenv
from typing import Annotated
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    RoomInputOptions,
    WorkerOptions,
    cli,
    metrics,
    tokenize,
    function_tool,
    RunContext,
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

from pathlib import Path
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(dotenv_path=env_path)


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are a smart, efficient, and friendly Starbucks barista. Be QUICK and CONCISE.
            
            **FLOW:**
            1.  Check if user wants "the usual" -> use `get_last_order` if yes
            2.  Take order (drink, size, milk, extras)
            3.  Suggest ONE food item (be brief!)
            4.  Confirm order
            5.  Get name
            6.  Ask "For here or to go?"
            7.  Save with `save_order` (misspell the name slightly - it's tradition!)
            8.  "Call out" the order to your imaginary colleague
            9.  Tell customer the total in ₹
            
            **CRITICAL:** Be FAST. Keep every response SHORT. No fluff.
            """,
        )

    @function_tool
    async def save_order(
        self,
        ctx: RunContext,
        drink_type: str,
        size: str,
        milk: str,
        extras: list[str],
        name: str,
    ):
        """Save the customer's order details.
        
        Use this tool ONLY when the customer has confirmed their order.
        
        Args:
            drink_type: The type of drink (e.g., Latte, Cappuccino).
            size: The size of the drink (Tall, Grande, Venti).
            milk: The type of milk (e.g., Whole, Oat, Almond).
            extras: A list of extra customizations (e.g., extra shot, vanilla syrup).
            name: The customer's name (make sure to misspell it slightly for that authentic Starbucks experience!).
        """
        logger.info(f"Saving order for {name}: {size} {drink_type}")
        
        # Calculate a random price in INR
        import random
        base_price = 250
        if size == "Grande": base_price += 50
        if size == "Venti": base_price += 100
        extra_cost = len(extras) * 30
        total_price = base_price + extra_cost
        
        order_data = {
            "drinkType": drink_type,
            "size": size,
            "milk": milk,
            "extras": extras,
            "name": name,
            "price": total_price
        }
        
        try:
            # Use absolute path for reliability and timestamp for uniqueness
            from pathlib import Path
            import time
            timestamp = int(time.time())
            filename = f"order_{timestamp}.json"
            # src -> backend -> project_root
            file_path = Path(__file__).resolve().parent.parent.parent / filename
            
            logger.info(f"Attempting to save order to: {file_path}")
            
            with open(file_path, "w") as f:
                json.dump(order_data, f, indent=2)
            
            logger.info(f"Order successfully saved to {file_path}")
            
            # Publish event to frontend
            payload = json.dumps({
                "type": "order_saved",
                "data": order_data
            })
            
            logger.info("Attempting to publish order_saved event...")
            if ctx.room and ctx.room.local_participant:
                await ctx.room.local_participant.publish_data(
                    payload.encode('utf-8'),
                    topic="agent_events"
                )
                logger.info("Successfully published order_saved event")
            else:
                logger.warning("Cannot publish event: Room or local participant not available")
            
            return f"Order saved! Total is ₹{total_price}."
        except Exception as e:
            error_msg = f"Failed to save order: {e}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            return f"Error saving order: {e}"

    @function_tool
    async def get_last_order(self, ctx: RunContext):
        """Retrieve the customer's last order (the 'usual').
        
        Use this tool when the customer asks for 'the usual' or asks what they ordered last time.
        """
        logger.info("Retrieving last order...")
        try:
            from pathlib import Path
            import glob
            import os
            
            # Find all order_*.json files in the project root
            project_root = Path(__file__).resolve().parent.parent.parent
            order_files = glob.glob(str(project_root / "order_*.json"))
            
            if not order_files:
                return "I couldn't find any previous orders."
            
            # Sort by modification time, newest first
            latest_file = max(order_files, key=os.path.getmtime)
            
            with open(latest_file, "r") as f:
                order_data = json.load(f)
                
            return f"Found the last order: {order_data['size']} {order_data['drinkType']} with {order_data['milk']} milk. Extras: {', '.join(order_data['extras'])}."
            
        except Exception as e:
            logger.error(f"Error retrieving last order: {e}")
            return "Sorry, I had trouble finding the last order."


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    try:
        # Logging setup
        # Add any other context you want in all log entries here
        ctx.log_context_fields = {
            "room": ctx.room.name,
        }

        # Set up a voice AI pipeline using OpenAI, Cartesia, AssemblyAI, and the LiveKit turn detector
        session = AgentSession(
            # Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
            # See all available models at https://docs.livekit.io/agents/models/stt/
            stt=deepgram.STT(model="nova-3"),
            # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
            # See all available models at https://docs.livekit.io/agents/models/llm/
            llm=google.LLM(
                model="gemini-2.5-flash",
            ),
            # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
            # See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
            tts=murf.TTS(
                    voice="en-US-matthew",
                    style="Conversation",
                    tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=1),
                ),
            # VAD and turn detection are used to determine when the user is speaking and when the agent should respond
            # See more at https://docs.livekit.io/agents/build/turns
            turn_detection=MultilingualModel(),
            vad=ctx.proc.userdata["vad"],
            # allow the LLM to generate a response while waiting for the end of turn
            # See more at https://docs.livekit.io/agents/build/audio/#preemptive-generation
            preemptive_generation=True,
        )

        # To use a realtime model instead of a voice pipeline, use the following session setup instead.
        # (Note: This is for the OpenAI Realtime API. For other providers, see https://docs.livekit.io/agents/models/realtime/))
        # 1. Install livekit-agents[openai]
        # 2. Set OPENAI_API_KEY in .env.local
        # 3. Add `from livekit.plugins import openai` to the top of this file
        # 4. Use the following session setup instead of the version above
        # session = AgentSession(
        #     llm=openai.realtime.RealtimeModel(voice="marin")
        # )

        # Metrics collection, to measure pipeline performance
        # For more information, see https://docs.livekit.io/agents/build/metrics/
        usage_collector = metrics.UsageCollector()

        @session.on("metrics_collected")
        def _on_metrics_collected(ev: MetricsCollectedEvent):
            metrics.log_metrics(ev.metrics)
            usage_collector.collect(ev.metrics)

        async def log_usage():
            summary = usage_collector.get_summary()
            logger.info(f"Usage: {summary}")

        ctx.add_shutdown_callback(log_usage)

        # # Add a virtual avatar to the session, if desired
        # # For other providers, see https://docs.livekit.io/agents/models/avatar/
        # avatar = hedra.AvatarSession(
        #   avatar_id="...",  # See https://docs.livekit.io/agents/models/avatar/plugins/hedra
        # )
        # # Start the avatar and wait for it to join
        # await avatar.start(session, room=ctx.room)

        # Start the session, which initializes the voice pipeline and warms up the models
        await session.start(
            agent=Assistant(),
            room=ctx.room,
            room_input_options=RoomInputOptions(
                # For telephony applications, use `BVCTelephony` for best results
                noise_cancellation=noise_cancellation.BVC(),
            ),
        )

        # Join the room and connect to the user
        await ctx.connect()
    
    except Exception as e:
        logger.error(f"Error in entrypoint: {e}")
        logger.error(traceback.format_exc())
        raise e


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
