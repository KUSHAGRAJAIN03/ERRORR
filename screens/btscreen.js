import React from 'react';
import { Text, View, TouchableOpacity, TextInput, Image, StyleSheet, ToastAndroid,KeyboardAvoidingView,Alert } from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';

export default class TransactionScreen extends React.Component {
    constructor(){
      super();
      this.state = {
        hasCameraPermissions: null,
        scanned: false,
        scannedBookId: '',
        scannedStudentId:'',
        buttonState: 'normal',
        transactionMessage:''
      }
    }

    getCameraPermissions = async id =>{
      const {status} = await Permissions.askAsync(Permissions.CAMERA);
      
      this.setState({
        hasCameraPermissions: status === "granted",
        buttonState: id,
        scanned: false
      });
    }

    handleBarCodeScanned = async({type, data})=>{
      const {buttonState} = this.state

      if(buttonState==="BookId"){
        this.setState({
          scanned: true,
          scannedBookId: data,
          buttonState: 'normal'
        });
      }
      else if(buttonState==="StudentId"){
        this.setState({
          scanned: true,
          scannedStudentId: data,
          buttonState: 'normal'
        });
      }
      
    }

    initiateBookIssue=async()=>{
    db.collection("Transaction").add({
      'studentid':this.state.scannedStudentId,
      'bookid':this.state.scannedBookId,
      'date':firebase.firestore.TimeStamp.now().toDate(),
      'transactiontype':"issue"
    })
    db.collection("Books").doc(this.state.scannedBookId).update({
      'bookavailability':false
    })
    db.collection("students").doc(this.state.scannedStudentId).update({
      'numberofbookissued':firebase.firestore.FieldValue.increment(1)
    })
    }

    initiateBookReturn=async()=>{
      db.collection("Transaction").add({
        'studentid':this.state.scannedStudentId,
        'bookid':this.state.scannedBookId,
        'date':firebase.firestore.TimeStamp.now().toDate(),
        'transactiontype':"return"
      })
      db.collection("Books").doc(this.state.scannedBookId).update({
        'bookavailability':true
      })
      db.collection("Students").doc(this.state.scannedStudentId).update({
        'numberofbookissued':firebase.firestore.FieldValue.increment(-1)
      })
    }

    checkBookAvailability=async()=>{
      const Bookref=await db
      .collection("Books")
      .where("bookid","==",this.state.scannedBookId)
      .get();
      var transactionType=""
      if (Bookref.docs.length==0){
        transactionType=false
      }
      else{
        Bookref.docs.map(doc=>{
          var book =doc.data();
          if (book.bookavailability){
            transactionType="Issue";
          }
          else{
            transactionType="Return"
          }
        })
      }
      return transactionType;
    }

    checkStudentEligibilitilyforBookIssue=async()=>{
      const Studentref=await db
      .collection("Students")
      .where("studentid","==",this.state.scannedStudentId)
      .get();
      var isStudentEligible=""
      if (Studentref.docs.length==0){
        this.setState({
          scannedBookId:"",
          scannedStudentId:""
        })
        isStudentEligible=false;
        Alert.alert("This student id does not exist");
      }
      else{
        Studentref.docs.map(doc=>{
          var student =doc.data();
          if (student.numberofbookissued<2)
          {
            isStudentEligible=true;
          }
          else{
            isStudentEligible=false;
            Alert.alert("this student has already issued 2 books")
            this.setState({
              scannedBookId:"",
              scannedStudentId:""
            })
          }
        })
      }
        return isStudentEligible;
    }

    checkStudentEligibilitilyforBookReturn=async()=>{
      const transactionRef=await db
      .collection("Transactions")
      .where("bookid","==",this.state.scannedBookId)
      .limit(1)
      .get();
      var isStudentEligible=""
      transactionRef.docs.map(doc=>{
        var lastBookTransaction=doc.data;
        if (lastBookTransaction.studentid==this.scannedStudentId){
          isStudentEligible=true;
        }
        else{
          isStudentEligible=false;
          Alert.alert("this book was not issued by this student")
          this.setState({
            scannedStudentId:"",
            scannedBookId:""
          })
        }
      })
      return isStudentEligible;
    }

    handleTransaction=async()=>{
      var transactionType=this.checkBookAvailability;
      if (!transactionType){
        Alert.alert("this book is not available");
        this.setState({
          scannedBookId:"",
          scannedStudentId:""
        })
      }
      else if (transactionType=="Issue")
      {
      var isStudentEligible=await this.checkStudentEligibilitilyforBookIssue
      if (isStudentEligible){
        this.initiateBookIssue;
        Alert.alert("this book is issued to you!!!")
      }
    }
      else if (transactionType=="Return")
      {
        var isStudentEligible=await this.checkStudentEligibilitilyforBookReturn
      if (isStudentEligible){
        this.initiateBookReturn;
        Alert.alert("this book is returned to the library!!!")
      }
      }
      
    }
    render() {
      const hasCameraPermissions = this.state.hasCameraPermissions;
      const scanned = this.state.scanned;
      const buttonState = this.state.buttonState;

      if (buttonState !== "normal" && hasCameraPermissions){
        return(
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        );
      }

      else if (buttonState === "normal"){
        return(
          <KeyboardAvoidingView style={styles.container}behavior="padding"enabled>
          <View >
            
              <Image
                source={require("../assets/booklogo.jpg")}
                style={{width:200, height: 200}}
/>
              <Text style={{textAlign: 'center', fontSize: 30}}>Wily</Text>
            </View>
            <View style={styles.inputView}>
            <TextInput 
              style={styles.inputBox}
              placeholder="Book Id"
              onChangeText={text=>{
                this.setState({scannedBookId:text})
              }}
              value={this.state.scannedBookId}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("BookId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>
            <View style={styles.inputView}>
            <TextInput 
              style={styles.inputBox}
              placeholder="Student Id"
              onChangeText={text=>{
                this.setState({scannedStudentId:text})
              }}
              value={this.state.scannedStudentId}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("StudentId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>
            <Text style={styles.transactionAlert}>
            {this.state.transactionMessage}
          </Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={async () => {
              var transactionMessage = this.handleTransaction();
            }}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
          {/* </View> */}
          </KeyboardAvoidingView>
        );
      }
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },

    scanButton:{
      backgroundColor: '#2196F3',
      padding: 10,
      margin: 10
    },
    buttonText:{
      fontSize: 15,
      textAlign: 'center',
      marginTop: 10
    },
    inputView:{
      flexDirection: 'row',
      margin: 20
    },
    inputBox:{
      width: 200,
      height: 40,
      borderWidth: 1.5,
      borderRightWidth: 0,
      fontSize: 20
    },
  submitButton: {
    backgroundColor: "#FBC02D",
    width: 100,
    height: 50
  },
  submitButtonText: {
    padding: 10,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "white"
  },
  transactionAlert: {
    margin: 10,
    color: "red"
  }
})