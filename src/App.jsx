import React, { useState, useRef } from "react";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef(null);
  const audioRef = useRef(new Audio());

  // Add language selection
  const [userLanguage, setUserLanguage] = useState("en-US");
  const [targetLanguage, setTargetLanguage] = useState("en-US");

  const startListening = () => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = userLanguage; // Set the recognition language

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("");
        setInput(transcript);
      };

      recognitionRef.current.start();
    }
  };

  const stopListeningAndSend = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      await handleSubmit();
    }
  };

  const playAudioResponse = (base64Audio) => {
    // Decode base64 to binary string
    const byteCharacters = atob(base64Audio);

    // Convert binary string to an array of bytes
    const byteNumbers = new Array(byteCharacters.length)
      .fill()
      .map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);

    // Create a Blob from the byte array
    const audioBlob = new Blob([byteArray], { type: "audio/mp3" });

    // Generate a URL for the Blob and set it as the source for the audio element
    const audioUrl = URL.createObjectURL(audioBlob);
    audioRef.current.src = audioUrl;

    // Play the audio
    audioRef.current.play();
  };

  const handleSubmit = async () => {
    if (input.trim()) {
      setIsLoading(true);
      const newUserMessage = { text: input, sender: "user" };

      // Update messages with user input
      setMessages((prevMessages) => [...prevMessages, newUserMessage]);

      try {
        const response = await fetch("http://localhost:3999/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: input,
            userLanguage, // Use the selected userLanguage
            targetLanguage, // Use the selected targetLanguage
          }),
        });

        const data = await response.json();
        console.log("API Response:", data); // Add this debug log

        // Add AI response to messages
        if (data.textResponse) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              text: data.textResponse,
              sender: "ai",
            },
          ]);
        } else {
          console.log("No textResponse in data:", data); // Add this debug log
        }

        // Play audio if available
        if (data.audioResponse) {
          playAudioResponse(data.audioResponse);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            text: "Sorry, there was an error processing your request.",
            sender: "ai",
          },
        ]);
      }

      setIsLoading(false);
      setInput("");
    }
  };

  return (
    <div className="App">
      <h1>AI Chat</h1>
      <div className="language-selectors">
        <select
          value={userLanguage}
          onChange={(e) => setUserLanguage(e.target.value)}
        >
          <option value="en-US">English</option>
          <option value="es-ES">Spanish</option>
          <option value="fr-FR">French</option>
          {/* Add more language options as needed */}
        </select>
        <select
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
        >
          <option value="en-US">English</option>
          <option value="es-ES">Spanish</option>
          <option value="fr-FR">French</option>
          {/* Add more language options as needed */}
        </select>
      </div>
      <div className="chat-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.text}
          </div>
        ))}
        {isLoading && <div className="message ai loading">...</div>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
        <button
          type="button"
          onMouseDown={startListening}
          onMouseUp={stopListeningAndSend}
          onTouchStart={startListening}
          onTouchEnd={stopListeningAndSend}
          disabled={isLoading}
        >
          Push to Talk
        </button>
      </form>
    </div>
  );
}

export default App;
