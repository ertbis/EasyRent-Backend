const Chat = require("../models/Chat")
const Message = require("../models/Messsage")
const Notification = require("../models/Notification")





const  createMessage = async (req, res) => {
    const {chatId  , text} = req.body
    const senderId = req.user.user_id

try {
    const message = await Message.create({
        chatId, 
        senderId,
         text
    })

     const chat = await  Chat.findById(chatId)
     const recipientId =  chat.members.filter(id  =>  id != senderId)

    const currentDate = new Date();

    // Get the year, month, and day
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // Months are zero-based, so add 1
    const day1 = currentDate.getDate();

    // Create formatted strings for the date
    const formattedDate = `${day1}-${month < 10 ? '0' : ''}${month}-${year}`;

    const notificationContent = {
      heading : "You received a new  message from",
      content : `You received a new  message in your Inbox - YMessage Body :: ${text}`,
      user_id : recipientId,
      attachment : message._id,
      Date : formattedDate
    }
    const newNotification = await Notification.create(notificationContent)

    res.status(201).json({message :" message sent successfully",  data : message})
} catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Failed to  createChat", message: error.message });
}
 
    
}




const findChatMessages = async (req, res ) => {
    const {chatId} = req.params
    try {
        const messages = await Message.find({chatId})
        if(!messages || messages  <= 0){
            return res.status(404).json({
                message : "No Message in found for this chat"
            })
        }

        res.status(200).json(messages)

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            error: "fail to fetch chat messages ",
             message : error.message
        })
    }
}


module.exports = {createMessage, findChatMessages}
