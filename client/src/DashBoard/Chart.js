import React,{useState, useEffect} from 'react';
import {Line} from 'react-chartjs-2';

  const options = {
    scales: {
      yAxes: [{

          ticks: {beginAtZero: true,},
        },
      ],
    },
  };
  
const Chart = () => {
  const[chartData,setchartData] = useState({});
  const Data = [0,0,0,0,0,0,0];
  const [connectionState,setconnectionState] = useState(true);

  const chart = () =>{
    const link = (process.env.NODE_ENV === 'development')?'http://localhost:5000/':'https://bca-helper-api.herokuapp.com/';
    fetch(`${link}api/Analytics?StartDate=2020-11-11`,{mode: "cors",method: 'GET'})
    .then((res)=>res.json())
    .then((jsonObj)=>{
      const obj = jsonObj[0]["rows"];
      for (const property in obj)
        Data[obj[property]['dimensionValues'][0]['value']] = parseInt(obj[property]['metricValues'][0]['value']);
        setchartData({
          labels: ['1', '2', '3', '4', '5', '6','7'],
          datasets: [
            {
              label: 'This Week',
              data: Data,
              fill: false,
              backgroundColor: 'rgb(255, 99, 132)',
              borderColor: 'rgba(255, 99, 132, 0.2)',
            },
            {
              label: 'Last Week',
              data: [0, 9, 13, 15, 12, 3, 11],
              fill: false,
              backgroundColor: 'rgb(205, 150, 0)',
              borderColor: 'rgba(255, 99, 132, 0.2)',
            }
          ],
        })         
      }).catch(()=>setconnectionState(false))


    };

  useEffect(()=>{
    chart();
  },[])
  return (  
    <>
        {(connectionState)?
        <>
          <>No of Users</>
          <Line data={chartData} options={options}/>
        </>:
        <>
Something went Wrong        
        </>
        }
    </>
  )
}

export default Chart;