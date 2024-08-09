'use client'

import { Box, Button, Stack, TextField } from '@mui/material'
import { useState, useEffect, useRef } from 'react'
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, addDoc, collection } from 'firebase/firestore'
import { auth, db} from './firebase' 
import { updateDoc, arrayUnion } from 'firebase/firestore';


export default function Home() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Headstarter support assistant. How can I help you today?",
    },
  ])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Effect to check if the user is authenticated when the component mounts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        // Store user info in Firestore when authenticated
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
        });
      } else {
        setUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  // Function to handle user sign-in
  const signIn = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      setUser(userCredential.user)
      // Store user info in Firestore after sign-in
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
      });

    } catch (error) {
      console.error('Authentication failed:', error)
      alert('Authentication failed. Please try again.')
    }
  }
  
  // Function to handle sending a message
  const sendMessage = async () => {
    if (!message.trim()) return;  // Don't send empty messages
    setIsLoading(true);
  
    // Prepare the message data
    const userMessage = { role: 'user', content: message };
    const assistantMessage = { role: 'assistant', content: '' };
  
    setMessages((messages) => [
      ...messages,
      userMessage,
      assistantMessage,
    ]);
  
    try {
      // Upload the user's message to Firestore
      const docRef = await addDoc(collection(db, 'messages'), {
        userId: user.uid,
        messages: [userMessage],  // Store the user message first
        timestamp: new Date(),
      });
  
      // Send the user message to the API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, userMessage]),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      // Process the assistant's response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantResponse += decoder.decode(value, { stream: true });
      }
  
      // Update the messages state with the assistant's full response
      setMessages((messages) => {
        const updatedMessages = messages.map((msg, index) => {
          if (index === messages.length - 1) {
            return { ...msg, content: assistantResponse };
          }
          return msg;
        });
        return updatedMessages;
      });
  
      // Update the Firestore document with the assistant's response
      await updateDoc(doc(db, 'messages', docRef.id), {
        messages: arrayUnion({ role: 'assistant', content: assistantResponse })
      });
  
    } catch (error) {
      console.error('Error:', error);
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }
  // Reference to scroll the chat to the bottom
  const messagesEndRef = useRef(null)

  // Function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Effect to automatically scroll to the bottom when messages update
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // If the user is not authenticated, display the sign-in form
  if (!user) {
    return (
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <Stack spacing={2} width="300px">
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button 
            variant="contained" 
            onClick={signIn} 
          >
            Sign In
          </Button>
        </Stack>
      </Box>
    )
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction={'column'}
        width="500px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? 'primary.main'
                    : 'secondary.main'
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction={'row'} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button 
            variant="contained" 
            onClick={sendMessage}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
