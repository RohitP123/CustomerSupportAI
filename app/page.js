'use client';
import { Box, Button, Typography, TextField, IconButton, Stack } from '@mui/material';
import { useState } from 'react';
import StarIcon from '@mui/icons-material/Star';

export default function Home() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hi, I am HeadStarterAI SupportBot. How can I assist you today?`
  }]);

  const [message, setMessage] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [followUp, setFollowUp] = useState(null);

  const sendMessage = async () => {
    setMessages('');
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' }
    ]);
    const response = fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, { role: 'user', content: message }])
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let result = '';
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result;
        }
        const text = decoder.decode(value || new Int8Array(), { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
        return reader.read().then(processText);
      });
    });
  };

  const handleStarClick = (value) => {
    setRating(value);
  };

  const handleSubmitFeedback = () => {
    // Add logic to handle feedback submission if needed
    console.log('Rating:', rating);
    console.log('Feedback:', feedback);
    console.log('Follow up:', followUp);

    // Close the feedback form
    setFeedbackOpen(false);
    
    // Clear form fields
    setRating(0);
    setFeedback('');
    setFollowUp(null);
  };

  return (
    <div>
      <Box 
        width="100vw" 
        height="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <Stack 
          direction="column"
          width="600px"
          height="700px"
          border="1px solid black"
          p={2}
          spacing={3}
        >
          <Stack 
            direction="column"
            spacing={2}
            flexGrow={1}
            overflow="auto"
            maxHeight="100%"
          >
            {
              messages.map((message, index) => (
                <Box 
                  key={index}
                  display="flex"
                  justifyContent={message.role === 'assistant' ? 'flex-start' : 'flex-end'}
                >
                  <Box 
                    p={3}
                    borderRadius={16}
                    bgcolor={message.role === 'assistant' ? 'primary.main' : 'secondary.main'}
                    color="white"
                  >
                    {message.content}
                  </Box>
                </Box>
              ))
            }
          </Stack>
          <Stack 
            direction="row"
            spacing={2}
          >
            <TextField
              label="Message"
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button 
              variant="contained"
              onClick={sendMessage}
            >
              Send
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box
        width="10vw" 
        height="10vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        position="fixed"
        bottom="0"
        right="0"
      >
        <Button
          onClick={() => setFeedbackOpen(!feedbackOpen)}
          sx={{
            width: '120px',
            height: '40px',
            backgroundColor: '#4169E1', // Royal blue color
            color: 'white',
            borderRadius: '20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            textTransform: 'none',
            ':hover': {
              backgroundColor: '#27408B', // Darker shade of royal blue on hover
            },
          }}
        >
          Feedback
        </Button>

        {feedbackOpen && (
          <Box
            sx={{
              position: 'fixed',
              bottom: '10vh',
              right: '1vw',
              width: '300px',
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '10px',
              boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
            }}
          >
            <Typography variant="h6" align="center" gutterBottom>
              Rate Your Feedback
            </Typography>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <IconButton
                  key={value}
                  onClick={() => handleStarClick(value)}
                  sx={{
                    color: value <= rating ? 'gold' : 'grey',
                  }}
                >
                  <StarIcon />
                </IconButton>
              ))}
            </Box>

            <TextField
              fullWidth
              variant="outlined"
              multiline
              rows={4}
              placeholder="Enter your opinions on the chatbot..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              sx={{ marginBottom: '20px' }}
            />

            <Typography align="center" gutterBottom>
              May we follow up with your feedback?
            </Typography>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-around',
                marginBottom: '20px',
              }}
            >
              <Button
                variant={followUp === true ? 'contained' : 'outlined'}
                onClick={() => setFollowUp(true)}
                sx={{
                  backgroundColor: followUp === true ? '#4169E1' : 'transparent',
                  color: followUp === true ? 'white' : '#4169E1',
                  borderColor: '#4169E1',
                }}
              >
                Yes
              </Button>
              <Button
                variant={followUp === false ? 'contained' : 'outlined'}
                onClick={() => setFollowUp(false)}
                sx={{
                  backgroundColor: followUp === false ? '#4169E1' : 'transparent',
                  color: followUp === false ? 'white' : '#4169E1',
                  borderColor: '#4169E1',
                }}
              >
                No
              </Button>
            </Box>

            <Button
              fullWidth
              variant="contained"
              sx={{
                backgroundColor: '#4169E1',
                color: 'white',
                textTransform: 'none',
              }}
              onClick={handleSubmitFeedback}
            >
              Submit
            </Button>
          </Box>
        )}
      </Box>
    </div>
  );
}
