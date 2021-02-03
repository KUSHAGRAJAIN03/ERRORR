import * as firebase from 'firebase';
require('@firebase/firestore');


const firebaseConfig = {
    apiKey: "AIzaSyB1pTkUN4_UOAN4oMSiGk6HquHvHg2eGs0",
    authDomain: "wily-app-cf1a0.firebaseapp.com",
    projectId: "wily-app-cf1a0",
    storageBucket: "wily-app-cf1a0.appspot.com",
    messagingSenderId: "185662925896",
    appId: "1:185662925896:web:6e61871620026cb936bc7d"
  };

  firebase.initializeApp(firebaseConfig);

  export default firebase.firestore();
