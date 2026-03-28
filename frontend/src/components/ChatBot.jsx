import {useState, useEffect, useRef} from 'react';
import {MessageCircle, X, Send, Mic, MicOff} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card} from '@/components/ui/card';
import {AI_SERVER_URL, SERVER_URL} from '@/lib/env';
import {toast} from 'sonner';

const CHAT_STORAGE_KEY = 'ai-chatbot-messages';
const CHAT_TIMESTAMP_KEY = 'ai-chatbot-timestamp';
const CHAT_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

const AIChatbot = () => {
    console.log('AI Bot activated!');
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    const getLocationData = async () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const {latitude, longitude} = position.coords;

                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
                            {
                                headers: {
                                    'User-Agent': 'EmergencyAlert/1.0',
                                },
                            }
                        );

                        const data = await response.json();

                        resolve({
                            latitude,
                            longitude,
                            pincode: data.address?.postcode || 'Unknown',
                            city:
                                data.address?.city ||
                                data.address?.town ||
                                data.address?.village ||
                                'Unknown',
                            state: data.address?.state || 'Unknown',
                            fullAddress: data.display_name,
                        });
                    } catch {
                        reject(new Error('Failed to fetch location details'));
                    }
                },
                () => reject(new Error('Failed to get location'))
            );
        });
    };

    // Initialize speech recognition
    useEffect(() => {
        if (
            'webkitSpeechRecognition' in window ||
            'SpeechRecognition' in window
        ) {
            const SpeechRecognition =
                window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                toast.error('Voice recognition failed. Please try again.');
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    // Load messages from localStorage
    useEffect(() => {
        const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
        const savedTimestamp = localStorage.getItem(CHAT_TIMESTAMP_KEY);

        if (savedMessages && savedTimestamp) {
            const now = Date.now();
            const timestamp = parseInt(savedTimestamp, 10);

            if (now - timestamp < CHAT_EXPIRY_TIME) {
                setMessages(JSON.parse(savedMessages));
            } else {
                // Clear expired messages
                localStorage.removeItem(CHAT_STORAGE_KEY);
                localStorage.removeItem(CHAT_TIMESTAMP_KEY);
            }
        }
    }, []);

    // Save messages to localStorage
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
            localStorage.setItem(CHAT_TIMESTAMP_KEY, Date.now().toString());
        }
    }, [messages]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

    // Clear expired messages every minute
    useEffect(() => {
        const interval = setInterval(() => {
            const savedTimestamp = localStorage.getItem(CHAT_TIMESTAMP_KEY);
            if (savedTimestamp) {
                const now = Date.now();
                const timestamp = parseInt(savedTimestamp, 10);
                if (now - timestamp >= CHAT_EXPIRY_TIME) {
                    setMessages([]);
                    localStorage.removeItem(CHAT_STORAGE_KEY);
                    localStorage.removeItem(CHAT_TIMESTAMP_KEY);
                }
            }
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast.error('Speech recognition is not supported in your browser.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const addMessage = (text, isUser = false, isError = false) => {
        const newMessage = {
            id: Date.now(),
            text,
            isUser,
            isError,
            timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            }),
        };
        setMessages((prev) => [...prev, newMessage]);
    };

    const handleGetRoute = async (query) => {
        try {
            // Step 1: Get route
            const routeResponse = await fetch(AI_SERVER_URL + '/ai/get_route', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({message: query, action: 'AS'}),
                credentials: 'include',
            });

            if (!routeResponse.ok) throw new Error('Failed to get route');

            const routeData = await routeResponse.json();
            const selectedRoute = routeData.selected_route;

            if (!selectedRoute) {
                throw new Error('Unknown route selected');
            }

            const locationData = await getLocationData();

            const apiResponse = await fetch(SERVER_URL + selectedRoute, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    audioVideo: 'NA',
                    pincode: locationData.pincode,
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                    location: locationData.fullAddress,
                    city: locationData.city,
                    state: locationData.state,
                    timeStamp: new Date().toISOString(),
                }),
                credentials: 'include',
            });

            if (!apiResponse.ok) throw new Error('API call failed');

            const apiData = await apiResponse.json();

            // Step 3: Interpret the response
            const interpretResponse = await fetch(
                AI_SERVER_URL + '/ai/interpret',
                {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({unformatted_data: apiData}),
                }
            );

            if (!interpretResponse.ok)
                throw new Error('Failed to interpret response');

            const interpretData = await interpretResponse.json();
            addMessage(interpretData.readable_message);
        } catch (error) {
            console.error('Get route error:', error);
            addMessage(
                'Sorry, I encountered an error processing your request.',
                false,
                true
            );
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userQuery = input.trim();
        setInput('');
        addMessage(userQuery, true);
        setIsLoading(true);

        try {
            await handleGetRoute(userQuery);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
                    size="icon"
                >
                    <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <Card className="fixed inset-0 w-full h-full sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[600px] shadow-2xl z-50 flex flex-col sm:rounded-lg rounded-none">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            <h3 className="font-semibold">AI Assistant</h3>
                        </div>
                        <Button
                            onClick={() => setIsOpen(false)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 mt-8">
                                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">
                                    Start a conversation with AI Assistant
                                </p>
                            </div>
                        )}

                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                        message.isUser
                                            ? 'bg-primary text-primary-foreground'
                                            : message.isError
                                              ? 'bg-red-100 text-red-900'
                                              : 'bg-white text-gray-900 shadow-sm border'
                                    }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                        {message.text}
                                    </p>
                                    <span className="text-xs opacity-70 mt-1 block">
                                        {message.timestamp}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
                                    <div className="flex gap-1">
                                        <div
                                            className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                                            style={{animationDelay: '0ms'}}
                                        ></div>
                                        <div
                                            className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                                            style={{animationDelay: '150ms'}}
                                        ></div>
                                        <div
                                            className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                                            style={{animationDelay: '300ms'}}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t bg-white rounded-b-lg">
                        {/* Input Box */}
                        <div className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                disabled={isLoading}
                                className="flex-1"
                            />

                            <Button
                                onClick={toggleListening}
                                variant={
                                    isListening ? 'destructive' : 'outline'
                                }
                                size="icon"
                                disabled={isLoading}
                            >
                                {isListening ? (
                                    <MicOff className="h-4 w-4" />
                                ) : (
                                    <Mic className="h-4 w-4" />
                                )}
                            </Button>

                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                size="icon"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>

                        {isListening && (
                            <p className="text-xs text-center mt-2 text-red-600 animate-pulse">
                                Listening...
                            </p>
                        )}
                    </div>
                </Card>
            )}
        </>
    );
};

export default AIChatbot;
