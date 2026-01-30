import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Connect to backend
        const newSocket = io('http://localhost:8000');

        newSocket.on('connect', () => {
            console.log('Connected to WebSocket');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from WebSocket');
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    return useContext(SocketContext);
};
