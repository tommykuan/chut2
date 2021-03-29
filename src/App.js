import './App.css'
import React, { useEffect, useState } from 'react'
import Clock from './Clock'

import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'
import firebaseConfig from './firebaseConfig'
import { useAuthState } from 'react-firebase-hooks/auth'

firebase.initializeApp(firebaseConfig)

const auth = firebase.auth()
const firestore = firebase.firestore()

var localBusStops = []

function SignIn() {
  const signInWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider()
    await auth.signInWithPopup(provider)

    firestore
      .collection('accounts')
      .doc(auth.currentUser.uid)
      .get()
      .then(async (doc) => {
        if (doc.exists) {
          console.log('account exists')

          let userRef = firebase
            .firestore()
            .collection('accounts')
            .doc(auth.currentUser.uid)
        } else {
          console.log('creating account...')
          const account = {
            useruid: auth.currentUser.uid,
            name: auth.currentUser.displayName,
            email: auth.currentUser.email,
            busStops: [],
          }

          await firebase
            .firestore()
            .collection('accounts')
            .doc(auth.currentUser.uid)
            .set(account)
        }
      })
  }
  return (
    <>
      <div>
        <h1 className="time">Welcome to Chut-Chut</h1>
        <p className="description">
          This web app stores bus stop #s in{' '}
          <a className="description" href="https://firebase.google.com/">
            Google Firebase
          </a>{' '}
          to display{' '}
          <a
            className="description"
            href="https://www.metrotransit.org/nextrip"
          >
            NexTrip
          </a>{' '}
          all in one page. I created this app for my fellow public commuters to
          conveniently check for arrival times because I am tired of waiting for
          the{' '}
          <a className="description" href="https://www.metrotransit.org/">
            MetroTransit app
          </a>{' '}
          to load. Sign in to start feeling convenient. Best performance on a
          mobile device.
        </p>
      </div>
      <div>
        <button className="sign-in" onClick={signInWithGoogle}>
          Sign in with Google
        </button>
      </div>
    </>
  )
}

function StopInput() {
  const [newStop, setNewStop] = useState('')

  async function addStopToDoc(e) {
    e.preventDefault()
    // console.log(newStop)
    const response = await fetch(
      `https://svc.metrotransit.org/NexTrip/${newStop}?format=json`
    )
    if (response.ok) {
      localBusStops.push(newStop)
      firestore
        .collection('accounts')
        .doc(auth.currentUser.uid)
        .get()
        .then(async (doc) => {
          if (doc.exists) {
            let userRef = firebase
              .firestore()
              .collection('accounts')
              .doc(auth.currentUser.uid)

            await userRef.update({
              busStops: firebase.firestore.FieldValue.arrayUnion(newStop),
            })

            console.log(`added ${newStop}`);
            
          }
        })
      e.target.reset()
    } else {
      // console.log(response)
      alert(`${newStop} is not a valid Metro Bus Stop ID.`)
    }
  }

  return (
    <form onSubmit={addStopToDoc}>
      <label className="mr-sm-2" htmlFor="busIDInput">
        Add Metro Bus Stop ID
      </label>
      <input
        type="number"
        onChange={(e) => setNewStop(e.target.value)}
        placeholder="16086"
        maxLength="5"
        max="99999"
        min="1"
        id="busIDInput"
        required
      ></input>

      <button className="add" type="submit" disabled={!newStop}>
        Add
      </button>
    </form>
  )
}

function removeStop(busStopID) {
  // console.log(busStopID.toString())

  localBusStops = localBusStops.filter((stop) => stop !== busStopID)
  firestore
    .collection('accounts')
    .doc(auth.currentUser.uid)
    .get()
    .then(async (doc) => {
      if (doc.exists) {
        let userRef = firebase
          .firestore()
          .collection('accounts')
          .doc(auth.currentUser.uid)

        await userRef.update({
          busStops: firebase.firestore.FieldValue.arrayRemove(
            busStopID.toString()
          ),
        })
      }
    })
}

var timer = 0

function Arrivals(props) {
  if (props.allStops.length == 0) {
    var output = 'Fetching bus stops...'
    timer++
    console.log(timer);
    if (timer >= 10) {
      output = 'No bus stops in database'
      return (
        <div>
          {' '}
          <h2>{`${output}`}</h2>
        </div>
      )
    }
    else {
      return (
        <div>
          {' '}
          <h2>{`${output}`}</h2>
        </div>
      )
    }
  } 
  else {
    return (
      <div>
        {props.allStops.map((stops, index) => {
          return (
            <div key={`${props.busStops[index]}_${index}`}>
              <h2>
                <a
                  className="a-btn"
                  href={`https://www.metrotransit.org/nextrip/${props.busStops[index]}`}
                  target="_blank"
                >
                  {props.busStops[index]}
                </a>

                <button
                  className="delete"
                  type="button"
                  onClick={(e) => removeStop(props.busStops[index])}
                >
                  &#10005;
                </button>
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
                    if (stops && !stops.length) {
                      return (
                        <tr>
                          <td> - </td>
                          <td> - </td>
                        </tr>
                      )
                    } else if (stops) {
                      return stops.slice(0, 5).map((times, tIndex) => {
                        return (
                          <tr
                            key={`${times.Route}_${times.DepartureTime}_${times.RouteDirection}`}
                          >
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
      </div>
    )
  }
}

const App = () => {
  const [user] = useAuthState(auth)

  // const busStops = [16086, 16085, 877, 16111, 16183, 49881, 41243]

  const initAllStops = [[{ Actual: false, DepartureText: 'Loading...' }]]

  const [allStops, setAllStops] = useState([])

  const getAllStops = async (localBusStops) => {
    const data = await Promise.all(
      localBusStops.map((busStop) => getArrivals(busStop))
    )
    return data
  }

  const generateKey = (name) => {
    return `${name}_${new Date().getTime()}`
  }

  const getArrivals = async (stopNum) => {
    const response = await fetch(
      `https://svc.metrotransit.org/NexTrip/${stopNum}?format=json`
    )
    if (response.ok) {
      const data = await response.json()
      return data
    }
  }

  const retrieveData = async () => {
    let data = await getAllStops(localBusStops)
    setAllStops(data)
    // console.log(allStops)

    if (user && auth.currentUser.uid) {
      let gg = await firestore
        .collection('accounts')
        .doc(auth.currentUser.uid)
        .get()

      if (
        localBusStops !== gg.data().busStops &&
        localBusStops.length <= gg.data().busStops.length
      ) {
        localBusStops = gg.data().busStops
      }
    }
  }

  function SignOut() {
    localBusStops = []
    return (
      auth.currentUser && (
        <button
          type="button"
          className="sign-out"
          onClick={() => {
            auth.signOut().then(setAllStops(initAllStops))
          }}
        >
          <span className="glyphicon glyphicon-log-out"></span>
        </button>
      )
    )
  }

  useEffect(() => {
    if (user) {
      const interval = setInterval(async () => {
        retrieveData()
      }, 1000)

      return () => {
        clearInterval(interval)
      }
    }
  }, [allStops, localBusStops, user])

  return (
    <div className="App">
      <header className="App-header"></header>
      {user ? (
        <div className="main-disp">
          <Clock />
          <div>
            <h2>
              Hello {auth.currentUser.displayName} <SignOut />
            </h2>
            <p className="signed-in-with">
              Signed in with {auth.currentUser.email}
            </p>
          </div>

          <StopInput />

          <Arrivals
            key={generateKey('')}
            allStops={allStops}
            busStops={localBusStops}
          />
        </div>
      ) : (
        <SignIn />
      )}
    </div>
  )
}

export default App
