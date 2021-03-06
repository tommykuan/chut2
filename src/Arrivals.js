function Arrivals(props) {
  return (
    <div>
      {props.allStops.map((stops, index) => {
        return (
          <div key={props.busStops[index]}>
            <h2>
              <a
                href={`https://www.metrotransit.org/nextrip/${props.busStops[index]}`}
                target="_blank"
              >
                {props.busStops[index]}
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
                        <td> - </td>
                        <td> - </td>
                      </tr>
                    )
                  } else {
                    return stops.slice(0, 5).map((times, tIndex) => {
                      return (
                        <tr key={times.DepartureText}>
                          <td className={`td ${times.Actual ? 'active' : ''}`}>
                            {times.Route}
                          </td>
                          <td className={`td ${times.Actual ? 'active' : ''}`}>
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
    </div>
  )
}

export default Arrivals
