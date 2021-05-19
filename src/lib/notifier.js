import Vonage from "@vonage/server-sdk";
import TinyURL from 'tinyurl';

const vonage = new Vonage({
   apiKey: process.env.vonageApiKey,
   apiSecret: process.env.vonageApiSecret
})

export function sendAlert(result, phoneNumbers) {
   const url = `https://www.doctolib.fr${result.url}`;
   TinyURL.shorten(url, function(res, err) {
      if (err) {
         console.log(err);
      } else {
         const from = "DocTracker"
         const text = `A slot has been found at ${res}`;
         phoneNumbers.forEach(to => sendSMS({from, to, text}));
      }
   });
}

function sendSMS({from, to, text}) {
   vonage.message.sendSms(from, to, text, (err, responseData) => {
      if (err) {
         console.log(err);
      } else {
         if(responseData.messages[0]['status'] === "0") {
               console.log("Message sent successfully.");
         } else {
               console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
         }
      }
   });
}