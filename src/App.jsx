import React, { useState, useRef } from "react";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef(null);
  const audioRef = useRef(new Audio());

  // Language selection for user and target language
  const [userLanguage, setUserLanguage] = useState("en-US");
  const [targetLanguage, setTargetLanguage] = useState("en-US");

  // Function to start listening for speech in the selected user language
  const startListening = () => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = userLanguage; // Set the recognition language to the user's language

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("");
        setInput(transcript); // Update input with the speech-to-text result
      };

      recognitionRef.current.start(); // Start listening
    }
  };

  // Function to stop listening and submit the message for processing
  const stopListeningAndSend = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop(); // Stop speech recognition
      await handleSubmit(); // Submit the message
    }
  };

  // Function to play the audio response from the backend
  const playAudioResponse = (base64Audio) => {
    const byteCharacters = atob(base64Audio); // Decode base64 to binary string
    const byteNumbers = Array.from(byteCharacters).map((char) =>
      char.charCodeAt(0)
    );
    const byteArray = new Uint8Array(byteNumbers);
    const audioBlob = new Blob([byteArray], { type: "audio/mp3" });
    const audioUrl = URL.createObjectURL(audioBlob);

    audioRef.current.src = audioUrl; // Set audio source to the URL
    audioRef.current.play(); // Play the audio
  };

  // Function to handle submitting the message
  const handleSubmit = async () => {
    if (input.trim()) {
      setIsLoading(true); // Set loading state
      const newUserMessage = { text: input, sender: "user" };

      // Update the messages list with the user's message
      setMessages((prevMessages) => [...prevMessages, newUserMessage]);

      try {
        const response = await fetch("http://localhost:3999/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: input, // Send the typed or spoken message
            userLanguage, // Send the selected user language
            targetLanguage, // Send the target language for translation
          }),
        });

        const data = await response.json();
        console.log("API Response:", data);

        // Update the messages list with the AI's response
        if (data.textResponse) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              text: data.textResponse,
              sender: "ai",
            },
          ]);
        }

        // Play the audio response if available
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

      setIsLoading(false); // Turn off loading state
      setInput(""); // Clear the input field
    }
  };

  return (
    <div className="App">
      <h1>AI Chat</h1>
      <div className="language-selectors">
        <label>
          Speak Language:
          <select
            value={userLanguage}
            onChange={(e) => setUserLanguage(e.target.value)}
          >
            <option value="en-US">English</option>
            <option value="ru-RU">Russian</option>
            <option value="it-IT">Italian</option>
            <option value="pl-PL">Polish</option>
            <option value="el-GR">Greek</option>
            <option value="yi">Yiddish</option>
            <option value="he-IL">Hebrew</option>
            <option value="ht-HT">Haitian Creole</option>
            <option value="fr-FR">French</option>
            <option value="es-ES">Spanish</option>
            <option value="pt-PT">Portuguese</option>
            <option value="zh-CN">Mandarin</option>
            <option value="zh-HK">Cantonese</option>
            <option value="hi-IN">Hindi</option>
            <option value="bn-IN">Bengali</option>
            <option value="te-IN">Telugu</option>
            <option value="pa-IN">Punjabi</option>
            <option value="ta-IN">Tamil</option>
            <option value="ko-KR">Korean</option>
            <option value="ja-JP">Japanese</option>
            <option value="vi-VN">Vietnamese</option>
            <option value="ar-SA">Arabic</option>
          </select>
        </label>
        <label>
          Translate To:
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
          >
            <option value="en-US">English</option>
            <option value="ru-RU">Russian</option>
            <option value="it-IT">Italian</option>
            <option value="pl-PL">Polish</option>
            <option value="el-GR">Greek</option>
            <option value="yi">Yiddish</option>
            <option value="he-IL">Hebrew</option>
            <option value="ht-HT">Haitian Creole</option>
            <option value="fr-FR">French</option>
            <option value="es-ES">Spanish</option>
            <option value="pt-PT">Portuguese</option>
            <option value="zh-CN">Mandarin</option>
            <option value="zh-HK">Cantonese</option>
            <option value="hi-IN">Hindi</option>
            <option value="bn-IN">Bengali</option>
            <option value="te-IN">Telugu</option>
            <option value="pa-IN">Punjabi</option>
            <option value="ta-IN">Tamil</option>
            <option value="ko-KR">Korean</option>
            <option value="ja-JP">Japanese</option>
            <option value="vi-VN">Vietnamese</option>
            <option value="ar-SA">Arabic</option>
          </select>
        </label>
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
          handleSubmit(); // Handle form submission
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading} // Disable input when loading
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
        <button
          type="button"
          onMouseDown={startListening} // Start listening for speech
          onMouseUp={stopListeningAndSend} // Stop and submit speech-to-text message
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
