'use client'

import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useState, useEffect, useRef } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, addDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { auth, db } from './firebase' 
import { updateDoc, arrayUnion } from 'firebase/firestore';

export default function Home() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('') // State for username
  const [isSignUp, setIsSignUp] = useState(false) // State to toggle between sign in and sign up
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
        // Fetch previous messages from Firestore
        await fetchMessages(user.uid)
      } else {
        setUser(null)
      }
    })

    // Fetch messages from localStorage on component mount
    const storedMessages = localStorage.getItem('chatMessages')
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages))
    }

    return () => unsubscribe()
  }, [])

  // Function to fetch previous messages from Firestore
  const fetchMessages = async (userId) => {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('userId', '==', userId),
        orderBy('timestamp', 'asc')
      )
      const querySnapshot = await getDocs(messagesQuery)
      const fetchedMessages = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        fetchedMessages.push(...data.messages)
      })
      setMessages(fetchedMessages)
      // Save messages to localStorage
      localStorage.setItem('chatMessages', JSON.stringify(fetchedMessages))
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  // Function to handle user sign-in
  const signIn = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      setUser(userCredential.user)
    } catch (error) {
      console.error('Authentication failed:', error)
      alert('Authentication failed. Please try again.')
    }
  }

  // Function to handle user sign-up
  const signUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      setUser(userCredential.user)
      // Store new user info in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        username: username // Save the username in Firestore
      });
    } catch (error) {
      console.error('Sign up failed:', error)
      alert('Sign up failed. Please try again.')
    }
  }

  // Function to handle sending a message
  const sendMessage = async () => {
    if (!message.trim()) return;  // Don't send empty messages
    setIsLoading(true);
  
    // Prepare the message data
    const userMessage = { role: 'user', content: message };
    const assistantMessage = { role: 'assistant', content: '' };
  
    setMessages((messages) => {
      const newMessages = [
        ...messages,
        userMessage,
        assistantMessage,
      ]
      // Save messages to localStorage
      localStorage.setItem('chatMessages', JSON.stringify(newMessages))
      return newMessages
    });
  
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
        // Save updated messages to localStorage
        localStorage.setItem('chatMessages', JSON.stringify(updatedMessages))
        return updatedMessages
      });
  
      // Update the Firestore document with the assistant's response
      await updateDoc(doc(db, 'messages', docRef.id), {
        messages: arrayUnion({ role: 'assistant', content: assistantResponse })
      });
  
    } catch (error) {
      console.error('Error:', error);
      setMessages((messages) => {
        const errorMessages = [
          ...messages,
          { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
        ]
        // Save error message to localStorage
        localStorage.setItem('chatMessages', JSON.stringify(errorMessages))
        return errorMessages
      });
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
          <Typography variant="h5" align="center">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Typography>
          {isSignUp && (
            <TextField
              label="Username"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}
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
            onClick={isSignUp ? signUp : signIn} 
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
          <Button 
            variant="text"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Don\'t have an account? Create one'}
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
