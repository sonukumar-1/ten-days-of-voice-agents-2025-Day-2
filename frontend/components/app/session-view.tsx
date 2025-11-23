'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { AppConfig } from '@/app-config';
import { ChatTranscript } from '@/components/app/chat-transcript';
import { PreConnectMessage } from '@/components/app/preconnect-message';
import { TileLayout } from '@/components/app/tile-layout';

import {
  AgentControlBar,
  type ControlBarControls,
} from '@/components/livekit/agent-control-bar/agent-control-bar';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useConnectionTimeout } from '@/hooks/useConnectionTimout';
import { useDebugMode } from '@/hooks/useDebug';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../livekit/scroll-area/scroll-area';

const MotionBottom = motion.create('div');

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';
const BOTTOM_VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
      translateY: '0%',
    },
    hidden: {
      opacity: 0,
      translateY: '100%',
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.3,
    delay: 0.5,
    ease: 'easeOut',
  } as any,
};

interface FadeProps {
  top?: boolean;
  bottom?: boolean;
  className?: string;
}

export function Fade({ top = false, bottom = false, className }: FadeProps) {
  return (
    <div
      className={cn(
        'from-background pointer-events-none h-4 bg-linear-to-b to-transparent',
        top && 'bg-linear-to-b',
        bottom && 'bg-linear-to-t',
        className
      )}
    />
  );
}
interface SessionViewProps {
  appConfig: AppConfig;
}

import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, DataPacket_Kind, RemoteParticipant } from 'livekit-client';
import { ImageViewer } from '@/components/app/image-viewer';

// ... (existing imports)

export const SessionView = ({
  appConfig,
  ...props
}: React.ComponentProps<'section'> & SessionViewProps) => {
  useConnectionTimeout(200_000);
  useDebugMode({ enabled: IN_DEVELOPMENT });

  const room = useRoomContext();
  const messages = useChatMessages();
  const [chatOpen, setChatOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [generatedImage, setGeneratedImage] = useState<{ url: string, prompt: string } | null>(null);

  const controls: ControlBarControls = {
    leave: true,
    microphone: true,
    chat: appConfig.supportsChatInput,
    camera: appConfig.supportsVideoInput,
    screenShare: appConfig.supportsVideoInput,
  };

  useEffect(() => {
    const lastMessage = messages.at(-1);
    const lastMessageIsLocal = lastMessage?.from?.isLocal === true;

    if (scrollAreaRef.current && lastMessageIsLocal) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const onDataReceived = (payload: Uint8Array, participant?: RemoteParticipant, kind?: DataPacket_Kind, topic?: string) => {
      if (topic === "agent_events") {
        try {
          const parsedPayload = JSON.parse(new TextDecoder().decode(payload));
          console.log("Received agent event:", parsedPayload); // Debug log
          if (parsedPayload.type === "image") {
            setGeneratedImage(parsedPayload.data);
          } else if (parsedPayload.type === "order_saved") {
            console.log("Order saved event received, dispatching to window"); // Debug log
            // Dispatch a custom event that OrderReceipt can listen to
            const event = new CustomEvent("order_saved", { detail: parsedPayload.data });
            window.dispatchEvent(event);
          }
        } catch (e) {
          console.error("Failed to parse agent event:", e);
        }
      }
    };

    room.on(RoomEvent.DataReceived, onDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, onDataReceived);
    };
  }, [room]);

  return (
    <section className="bg-background relative z-10 h-full w-full overflow-hidden" {...props}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary to-transparent" />

      {/* Branding Header */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xs">
          SB
        </div>
        <span className="text-primary font-bold tracking-widest text-sm">STARBUCKS</span>
      </div>

      {/* Image Viewer Overlay */}
      <ImageViewer
        imageUrl={generatedImage?.url ?? null}
        prompt={generatedImage?.prompt ?? null}
        onClose={() => setGeneratedImage(null)}
      />

      {/* Chat Transcript */}
      <div
        className={cn(
          'fixed inset-0 grid grid-cols-1 grid-rows-1',
          !chatOpen && 'pointer-events-none'
        )}
      >
        <Fade top className="absolute inset-x-4 top-0 h-40" />
        <ScrollArea ref={scrollAreaRef} className="px-4 pt-40 pb-[150px] md:px-6 md:pb-[180px]">
          <ChatTranscript
            hidden={!chatOpen}
            messages={messages}
            className="mx-auto max-w-2xl space-y-3 transition-opacity duration-300 ease-out"
          />
        </ScrollArea>
      </div>

      {/* Tile Layout */}
      <TileLayout chatOpen={chatOpen} />

      {/* Bottom */}
      <MotionBottom
        {...BOTTOM_VIEW_MOTION_PROPS}
        className="fixed inset-x-3 bottom-0 z-50 md:inset-x-12"
      >
        {appConfig.isPreConnectBufferEnabled && (
          <PreConnectMessage messages={messages} className="pb-4" />
        )}
        <div className="bg-background/80 backdrop-blur-md relative mx-auto max-w-2xl pb-3 md:pb-12 rounded-t-2xl border-t border-primary/10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          <Fade bottom className="absolute inset-x-0 top-0 h-4 -translate-y-full" />
          <AgentControlBar controls={controls} onChatOpenChange={setChatOpen} />
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <p className="text-[10px] text-muted-foreground/60 font-medium tracking-widest uppercase">
              © 2025 Starbucks Coffee Company. All rights reserved.
            </p>
          </div>
        </div>
      </MotionBottom>
    </section>
  );
};
