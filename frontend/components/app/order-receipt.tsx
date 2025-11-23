import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, DataPacket_Kind, RemoteParticipant } from 'livekit-client';

interface OrderData {
    drinkType: string;
    size: string;
    milk: string;
    extras: string[];
    name: string;
    price: number;
}

export function OrderReceipt() {
    const messages = useChatMessages();
    const room = useRoomContext();
    const lastUserMessage = messages.filter(m => m.from?.isLocal).at(-1)?.message || "Listening...";
    const [order, setOrder] = useState<OrderData | null>(null);

    useEffect(() => {
        const onDataReceived = (payload: Uint8Array, participant?: RemoteParticipant, kind?: DataPacket_Kind, topic?: string) => {
            console.log('[OrderReceipt] Data received, topic:', topic); // Debug
            if (topic === 'agent_events') {
                try {
                    const decoder = new TextDecoder();
                    const strData = decoder.decode(payload);
                    const data = JSON.parse(strData);
                    console.log('[OrderReceipt] Parsed data:', data); // Debug
                    if (data.type === 'order_saved') {
                        console.log('[OrderReceipt] Setting order:', data.data); // Debug
                        setOrder(data.data);
                    }
                } catch (e) {
                    console.error('[OrderReceipt] Failed to parse agent event', e);
                }
            }
        };

        room.on(RoomEvent.DataReceived, onDataReceived);
        return () => {
            room.off(RoomEvent.DataReceived, onDataReceived);
        };
    }, [room]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute top-16 right-4 left-4 md:left-auto md:top-20 z-40 md:w-80 bg-white text-black shadow-2xl font-mono text-sm overflow-hidden"
            style={{
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 98% 98%, 96% 100%, 94% 98%, 92% 100%, 90% 98%, 88% 100%, 86% 98%, 84% 100%, 82% 98%, 80% 100%, 78% 98%, 76% 100%, 74% 98%, 72% 100%, 70% 98%, 68% 100%, 66% 98%, 64% 100%, 62% 98%, 60% 100%, 58% 98%, 56% 100%, 54% 98%, 52% 100%, 50% 98%, 48% 100%, 46% 98%, 44% 100%, 42% 98%, 40% 100%, 38% 98%, 36% 100%, 34% 98%, 32% 100%, 30% 98%, 28% 100%, 26% 98%, 24% 100%, 22% 98%, 20% 100%, 18% 98%, 16% 100%, 14% 98%, 12% 100%, 10% 98%, 8% 100%, 6% 98%, 4% 100%, 2% 98%, 0 100%)'
            }}
        >
            <div className="p-6 pb-8 space-y-4">
                <div className="text-center border-b-2 border-black/10 pb-4">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#00704A] flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                            <line x1="6" y1="1" x2="6" y2="4" />
                            <line x1="10" y1="1" x2="10" y2="4" />
                            <line x1="14" y1="1" x2="14" y2="4" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-xl tracking-wider">STARBUCKS</h3>
                    <p className="text-xs text-gray-500">Store #8832 • 123 Coffee Lane</p>
                    <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
                </div>

                {order ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    visible: { transition: { staggerChildren: 0.1 } }
                                }}
                            >
                                <motion.p variants={{ hidden: { opacity: 0, y: 5 }, visible: { opacity: 1, y: 0 } }} className="font-bold text-lg">{order.size} {order.drinkType}</motion.p>
                                <motion.p variants={{ hidden: { opacity: 0, y: 5 }, visible: { opacity: 1, y: 0 } }} className="text-xs text-gray-600">{order.milk}</motion.p>
                                {order.extras.map((extra, i) => (
                                    <motion.p key={i} variants={{ hidden: { opacity: 0, y: 5 }, visible: { opacity: 1, y: 0 } }} className="text-xs text-gray-600">+ {extra}</motion.p>
                                ))}
                            </motion.div>
                            <p className="font-bold">₹{order.price}.00</p>
                        </div>

                        <div className="border-t-2 border-black/10 pt-2 flex justify-between items-end">
                            <p className="font-bold text-xl">TOTAL</p>
                            <p className="font-bold text-2xl">₹{order.price}.00</p>
                        </div>

                        <div className="border-t-2 border-black/10 pt-4 text-center space-y-2">
                            <p className="font-bold text-lg uppercase">For: {order.name}</p>
                            <div className="h-12 bg-black/10 mx-auto w-full flex items-center justify-center overflow-hidden">
                                {/* Fake Barcode */}
                                <div className="flex gap-1 h-full w-full justify-center opacity-70">
                                    {[...Array(40)].map((_, i) => (
                                        <div key={i} className="bg-black h-full" style={{ width: Math.random() > 0.5 ? '2px' : '4px' }}></div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-[10px] tracking-widest">1234-5678-9012-3456</p>
                            <p className="font-bold text-sm mt-2">THANK YOU!</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <p className="animate-pulse">Waiting for order...</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
