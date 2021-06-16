import React, {useEffect, useState } from "react";
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Cookies from 'js-cookie';

const useStyles = makeStyles((theme) => ({
  backdrop: { 
    zIndex: theme.zIndex.drawer + 1, 
    color: '#fff', 
  },
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

const SignIn = (props) =>{

  const [open, setOpen] = React.useState(false);
  const [Email, setEmail] = useState('')
  const [Password, setPassword] = useState('')
  const classes = useStyles();

  const [Email_Notification,setEmail_Notification] = useState('');
  const [Password_Notification,setPassword_Notification] = useState('');
  const [DOS_Notification,setDOS_Notification] = useState('');

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    const UserName = Cookies.get('userName')
    const Token  = Cookies.get('Token')
    if((UserName !== undefined) && (Token !== undefined)){    
      fetch(`http://localhost:5000/api/tokenverify?UserName=${UserName}&Token=${Token}`,{
        mode: "cors",
        method: 'GET'
      })
      .then(response => response.json())
      .then(data => {
        if(data.verified){
          console.log("Logging In Using Cookies")
          props.logIn();
        }})
      .catch(er=>console.log(er))}
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function Login() {
    setEmail_Notification("");
    setPassword_Notification("")
    if(Email===''){
      setEmail_Notification("Empty Email");
      return 
    }
    if(Password===''){
      setPassword_Notification("Empty Password")
      return
    }
    setOpen(!open);
    fetch(`http://localhost:5000/api/login?userName=${Email}&password=${Password}`,{
      mode: "cors",
      method: 'GET'
    })
    .then(response => {
      handleClose();
      if (!response.ok || response.status===429) {
        console.log('Too Many reqs')
        setDOS_Notification("Too Many Login Attempts, Try Again after 1 Hr")
        return null;
      }
      return response.json();
    })
    .then(data => {
      if(data===null)
        return;
      if(data.LoggedIn){
        props.logIn(true);
      }
      else{
        console.log(data.reason)
        if(data.reason==='Invalid Password') setPassword_Notification(data.reason)
        else if(data.reason==='Invalid Username') setEmail_Notification("Invalid Email ID")
      }
    })
    .catch(er=>{console.log(er);handleClose();})
  }
 
  return (
    <div>
      <Backdrop className={classes.backdrop} open={open}>
      <CircularProgress color="inherit" />
      </Backdrop>
      <p id="header">Admin Login</p>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <form className={classes.form} noValidate>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              onChange={event => setEmail(event.target.value)}
            />
            <div style={{color: 'red'}}>{Email_Notification}</div>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              onChange={event => setPassword(event.target.value)}
            />
            <div style={{color: 'red'}}>{Password_Notification}</div>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
              onClick={()=>Login()}
            >
              Sign In
            </Button>
            <div style={{color: 'red', textAlign: "center"}}>{DOS_Notification}</div>
          </form>
        </div>
      </Container>
    </div>
  );
}

export default SignIn;