import React, {useState} from "react";
import "./App.css";
import Signin from './SignIn';
import Dashboard from './DashBoard/Dashboard';
import Typography from '@material-ui/core/Typography';

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © BCA Helper App '}
      {new Date().getFullYear()}
    </Typography>
  );
}

function App() {
  const [LoggedIn, setLoggedIn] = useState(true);
  return (
    <div>
      <div className="content-container">
        {LoggedIn?<Dashboard/>:<Signin logIn = {setLoggedIn}/>}
      </div>
      <footer className="footer--pin">
          <Copyright />
      </footer>
    </div>
  );
}

export default App;