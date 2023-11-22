
const Tour = require("../models/Tour");
const { transporter }  = require("../utils/nodemailer.config");
require('dotenv').config()


const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const makePayment = async (req, res) => {
  const {email} = req.user
  const { amount, Id } = req.body;

 try {
     const session = await stripe.checkout.sessions.create({
       line_items: [
         {
           price_data: {
             currency: 'usd',
             product_data: {
               name: "Agent Fee",
             },
             unit_amount: amount * 100,
           },
           quantity: 1,

         },
       ],
       mode: 'payment',
       success_url: `${process.env.CLIENT_URL}/chatagent`,
       cancel_url: `${process.env.CLIENT_URL}/payment/${Id}`,
     });
     if(session){
         await Tour.findByIdAndUpdate(Id, { paid : true})
     
           
      const emailResp = await sendEmail({email}, res)
         res.send({url : session.url});
         
     } else {
         res.status(400).send("something went wrong")
    }
   
     
 } catch (error) {
   console.log(error)
     res.status(400).send(error)
 }
}


const sendEmail = async ({ email }, res) => {

    try {
 
     
       const mailOptions = {
          from: process.env.AUTH_EMAIL,
          to: email,
          subject: 'Tour Payment Successful',
          html: `<p>You have successfully paid <b>1000 Naira</b> for a tour on ERT </p>`
 
       }
 
 
    
 
       await transporter.sendMail(mailOptions);
       return {
          status: "PENDING",
          message: " email sent successfully",
          data: {
             userId: _id,
             email
          },
       }
    
    } catch (error) {
       return {
          status: "FAILED",
          message: error.message
       }
    
    }
 }


module.exports = { makePayment };





















// require('dotenv').config();
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


// const Payment = async (req, res) => {
//     try {
//       const { amount, bank, token } = req.body;
  
//       // Create a PIntent on the server
//       const paymentIntent = await stripe.paymentIntents.create({
//         amount,
//         currency: 'usd',
//         payment_method_types: ['card'],
//         payment_method_data: {
//           type: 'card',
//           card: { token },
//         },
//         description: `Payment for ${bank}`,
//       });
  
//       // Confirm the PaymentIntent
//       const confirmPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id);
  
//       // Handle the confirmation result as needed
//       console.log(confirmPaymentIntent);
  
//       res.json({ status: 'success' });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Server error' });
//     }
//   };
  

//   module.exports = {Payment}




