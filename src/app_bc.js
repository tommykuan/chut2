import './App.css'
import React, { useEffect, useState, useCallback } from 'react'
import Clock from './Clock'

const App = () => {
  const busStops = [16086, 16085, 877, 16111, 16183, 49881, 41243]

  const [allStops, setAllStops] = useState([
    [
      {
        Actual: false,
        DepartureText: 'Loading...',
      },
    ],
  ])

  const getAllStops = async (busStops) => {
    const data = await Promise.all(
      busStops.map((busStop) => getArrivals(busStop))
    )
    return data
  }

  const getArrivals = async (stopNum) => {
    const response = await fetch(
      `https://svc.metrotransit.org/NexTrip/${stopNum}?format=json`
    )
    const data = await response.json()

    return data
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      let data = await getAllStops(busStops)
      setAllStops((allStops) => data)
      console.log(allStops)
    }, 2000)

    return () => {
      clearInterval(interval)
    }
  }, [allStops, busStops])

  return (
    <div className="App">
      <header className="App-header">
        <Clock />
        {allStops.map((stops, index) => {
          return (
            <div>
              <h2>
                <a
                  href={`https://www.metrotransit.org/nextrip/${busStops[index]}`}
                  target="_blank"
                >
                  {busStops[index]}
                </a>
              </h2>
              <table>
                <thead>
                  <tr>
                    <th>Bus No.</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (!stops.length) {
                      return (
                        <tr>
                          <td>none</td>
                          <td>none</td>
                        </tr>
                      )
                    } else {
                      return stops.slice(0, 5).map((times, tIndex) => {
                        return (
                          <tr>
                            <td
                              className={`td ${times.Actual ? 'active' : ''}`}
                            >
                              {times.Route}
                            </td>
                            <td
                              className={`td ${times.Actual ? 'active' : ''}`}
                            >
                              {times.DepartureText}
                            </td>
                          </tr>
                        )
                      })
                    }
                  })()}
                </tbody>
              </table>
            </div>
          )
        })}
      </header>
    </div>
  )
}

export default App
