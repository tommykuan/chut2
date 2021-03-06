import React, { useState, useEffect } from 'react'

function Clock(props) {
  //Here we reference our custom hook
  const timer = useNewTimer(new Date())

  return (
    <div>
      <h1 className='time'>{timer.toLocaleTimeString()}</h1>
    </div>
  )
}

function useNewTimer(currentDate) {
  const [date, setDate] = React.useState(currentDate)

  React.useEffect(() => {
    var timerID = setInterval(() => tick(), 1000)
    return function cleanup() {
      clearInterval(timerID)
    }
  })

  function tick() {
    setDate(new Date())
  }

  return date
}

export default Clock
