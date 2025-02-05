import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import io from "socket.io-client";
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  BellIcon,
  CalendarDaysIcon,
  InboxArrowDownIcon,
  ArrowUpOnSquareIcon,
  SunIcon,
  MoonIcon,
  CogIcon,
  PhotoIcon,
  MicrophoneIcon,
  FaceSmileIcon,
  PlusIcon,
  PaperAirplaneIcon,
  VideoCameraIcon,
  PhoneIcon,
  UserPlusIcon,
  EllipsisVerticalIcon,
  PaperClipIcon,
  DocumentIcon,
} from "@heroicons/react/24/solid";

const socket = io("http://localhost:5000", {
  withCredentials: true,
});

const generateAvatar = (username) => {
  if (!username) return { initial: "?", backgroundColor: "#cccccc" };

  const avatarKey = `userAvatarImage_${username}`;
  const existingAvatar = localStorage.getItem(avatarKey);

  if (existingAvatar) {
    return JSON.parse(existingAvatar);
  }

  const colors = [
    "#FFD700", "#FFA07A", "#87CEEB", "#98FB98", "#DDA0DD", "#FFB6C1", "#FFC0CB",
    "#20B2AA", "#FF6347", "#708090", "#9370DB", "#90EE90", "#B0E0E6",
  ];
  const backgroundColor = colors[Math.floor(Math.random() * colors.length)];
  const initial = username.charAt(0).toUpperCase();

  const avatarImage = { initial, backgroundColor };
  localStorage.setItem(avatarKey, JSON.stringify(avatarImage));
  return avatarImage;
};

const ChatApp = () => {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [filePreview, setFilePreview] = useState(null);
  const [file, setFile] = useState(null);
  const [showMediaOptions, setShowMediaOptions] = useState(false);

  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
      const userId = localStorage.getItem("userId");
  
      if (userId) {
        socket.emit("add-user", userId);
      } else {
        console.warn("User ID not found in localStorage");
      }
  
      return () => {
        socket.disconnect();
      };
    }, []);
    useEffect(() => {
        const fetchUser = async () => {
          try {
            const userId = localStorage.getItem("userId");
            if (!userId) {
              setLoading(false);
              return;
            }
    
            const response = await fetch(`http://localhost:5000/api/auths/getAllUsers/${userId}`);
            if (!response.ok) throw new Error("Failed to fetch user data");
    
            const data = await response.json();
            const avatarImage = generateAvatar(data.username);
            setUser({ ...data, avatarImage });
          } catch (error) {
            console.error("Error fetching user data:", error.message);
          } finally {
            setLoading(false);
          }
        };
    
        fetchUser();
      }, []);
    
      const fetchChannels = async (query = "") => {
        try {
          const response = await fetch("http://localhost:5000/api/auths/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
          });
    
          if (!response.ok) {
            console.error("Error fetching channels:", response.statusText);
            return;
          }
    
          const data = await response.json();
          const channelsWithAvatars = data.map((channel) => ({
            ...channel,
            avatarImage: generateAvatar(channel.username),
          }));
          setChannels(channelsWithAvatars);
        } catch (error) {
          console.error("Error fetching channels:", error.message);
        }
      };

       useEffect(() => {
          socket.on("msg-recieve", ({ msg, from, isChatRequest }) => {
            setMessages((prevMessages) => [
              ...prevMessages,
              { fromSelf: from === localStorage.getItem("userId"), message: msg, isChatRequest },
            ]);
          });
      
          return () => {
            socket.off("msg-recieve");
          };
        }, []);
  
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);


  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;
  
    setFile(selectedFile);
    setNewMessage(selectedFile.name); // Set the file name in the input box
  
    if (selectedFile.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(selectedFile)); // Display image preview
    } else if (selectedFile.type.startsWith("video/")) {
      setFilePreview("📹 " + selectedFile.name); // Show video icon with filename
    } else {
      setFilePreview(selectedFile.name); // Display file name for non-image files
    }
  };
  

  const sendMessage = async () => {
    if (!newMessage.trim() && !file) return;

    const messagePayload = {
      from: localStorage.getItem("userId"),
      to: selectedChannel?._id,
      message: newMessage,
      file,
    };

    socket.emit("send-msg", messagePayload);
    setMessages((prev) => [
      ...prev,
      { fromSelf: true, message: newMessage, file },
    ]);
    setNewMessage("");
    setFile(null);
    setFilePreview(null);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    fetchChannels(e.target.value); // Fetch channels based on search query
  };
  

  return (
    <div className={`flex h-screen ${darkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      <aside className="w-20 bg-gradient-to-br from-blue-300 to-gray-500 dark:from-gray-800 dark:to-gray-900 flex flex-col py-6 space-y-6 items-center">
        {loading ? (
          <div className="h-16 w-16 rounded-full bg-gray-300 animate-pulse" />
        ) : user ? (
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
            style={{
              backgroundColor: user.avatarImage.backgroundColor,
            }}
          >
            {user.avatarImage.initial}
          </div>
        ) : (
          <div className="h-16 w-16 rounded-full bg-gray-400 flex items-center justify-center text-white">
            ?
          </div>
        )}

        <div className="space-y-6">
          <ChatBubbleLeftRightIcon className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" />
          <UserGroupIcon className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" />
          <BellIcon className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" />
          <CalendarDaysIcon className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" />
          <InboxArrowDownIcon className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" />
          <ArrowUpOnSquareIcon className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" />
          <UserPlusIcon className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" />
        </div>

        <div className="flex-1"></div>

        <button
          className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer"
          onClick={toggleDarkMode}
        >
          {darkMode ? (
            <SunIcon className="h-8 w-8" />
          ) : (
            <MoonIcon className="h-8 w-8" />
          )}
        </button>
        <button className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer">
          <CogIcon />
        </button>
      </aside>

      {/* Channel List */}
            <aside className="w-80 bg-gray-100 dark:bg-gray-900 border-r dark:border-gray-700 flex flex-col">
              <div className="flex items-center p-4">
                <input
                  type="text"
                  placeholder="Search"
                  className="px-4 py-2 rounded-full border dark:bg-gray-700 dark:text-white"
                  value={search}
                  onChange={handleSearch}
                />
                <button
                  className="ml-4 text-blue-500"
                  onClick={() => setChannels([])} // Optionally clear channels
                >
                  <PlusIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4 overflow-y-auto flex-1">
                {channels.map((channel) => (
                  <div
                    key={channel._id}
                    className="flex items-center space-x-4 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 p-4"
                    onClick={() => setSelectedChannel(channel)}
                  >
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                      style={{ backgroundColor: channel.avatarImage.backgroundColor }}
                    >
                      {channel.avatarImage.initial}
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                        {channel.username}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Last message...</div>
                    </div>
                    <EllipsisVerticalIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </div>
                ))}
              </div>
            </aside>
      

      {/* Main Content */}
      <main className="flex-1 flex flex-col">

        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-6 py-4">
                  {selectedChannel ? (
                    <>
                      <div className="flex items-center">
                        <div
                          className="h-12 w-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                          style={{ backgroundColor: selectedChannel.avatarImage.backgroundColor }}
                        >
                          {selectedChannel.avatarImage.initial}
                        </div>
                        <div>
                          <p className="text-lg font-semibold">
                            {selectedChannel.username}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Online
                          </p>
                        </div>
                          
                        
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <button>
                          <VideoCameraIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                        </button>
                        <button>
                          <PhoneIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                        </button>
                        <button>
                          <UserPlusIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                        </button>
                        <button>
                          <EllipsisVerticalIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">Select a Channel</span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
  <div className="space-y-4">
    {messages.map((msg, index) => (
      <div key={index} className={`flex ${msg.fromSelf ? "justify-end" : "justify-start"}`}>
        <div
          className={`rounded-lg px-4 py-2 max-w-xs break-words ${
            msg.file
              ? "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white"
              : msg.fromSelf
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 dark:text-white"
          }`}
        >
          {msg.message && <p>{msg.message}</p>}

          {msg.file && (
            <div className="mt-2">
              {msg.file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(msg.file)}
                  alt="file preview"
                  className="w-12 h-12 object-cover rounded-md"
                />
              ) : (
                <a
                  href={URL.createObjectURL(msg.file)}
                  download={msg.file.name}
                  className="text-blue-600 underline"
                >
                  {msg.file.name}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
</div>

        

{showMediaOptions && (
  <div className="flex space-x-4 p-4 bg-gray-100 dark:bg-gray-800">
    <div>
      <input
        type="file"
        ref={imageInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, "image")}
      />
      <button onClick={() => imageInputRef.current.click()}>
        <PhotoIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        <span>Gallery</span>
      </button>
    </div>

    <div>
      <input
        type="file"
        ref={documentInputRef}
        className="hidden"
        accept=".pdf,.doc,.docx,.ppt,.txt,.csv,.xlsx"
        onChange={(e) => handleFileSelect(e, "document")}
      />
      <button onClick={() => documentInputRef.current.click()}>
        <DocumentIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        <span>Document</span>
      </button>
    </div>

    <div>
      <input
        type="file"
        ref={videoInputRef}
        className="hidden"
        accept="video/*"
        onChange={(e) => handleFileSelect(e, "video")}
      />
      <button onClick={() => videoInputRef.current.click()}>
        <VideoCameraIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        <span>Video</span>
      </button>
    </div>
  </div>
)}


        {/* Message Input */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 flex items-center space-x-4">
          <button onClick={() => setShowMediaOptions((prev) => !prev)}>
            <PaperClipIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border dark:bg-gray-700 dark:text-white"
          />

          <button onClick={sendMessage}>
            <div className="flex space-x-4">
              <PlusIcon className="h-6 w-6 text-gray-600 cursor-pointer" />
              <FaceSmileIcon className="h-6 w-6 text-gray-600 cursor-pointer" />
              <MicrophoneIcon className="h-6 w-6 text-gray-600 cursor-pointer" />
              <PaperAirplaneIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </div>
          </button>
        </div>
      </main>
    </div>
  );
};

export default ChatApp;
