import './App.css'
import React, { useEffect, useState } from 'react'
import Clock from './Clock'
// import Arrivals from './Arrivals'

import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'
import firebaseConfig from './firebaseConfig'
import { useAuthState } from 'react-firebase-hooks/auth'
import { useCollectionData } from 'react-firebase-hooks/firestore'

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
      .then((doc) => {
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

          firebase
            .firestore()
            .collection('accounts')
            .doc(auth.currentUser.uid)
            .set(account)
        }
      })
  }
  return (
    <button className="sign-in" onClick={signInWithGoogle}>
      Sign in with Google
    </button>
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
        .then((doc) => {
          if (doc.exists) {
            let userRef = firebase
              .firestore()
              .collection('accounts')
              .doc(auth.currentUser.uid)

            userRef.update({
              busStops: firebase.firestore.FieldValue.arrayUnion(newStop),
            })
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
    .then((doc) => {
      if (doc.exists) {
        let userRef = firebase
          .firestore()
          .collection('accounts')
          .doc(auth.currentUser.uid)

        userRef.update({
          busStops: firebase.firestore.FieldValue.arrayRemove(
            busStopID.toString()
          ),
        })
      }
    })
}

function Arrivals(props) {
  return (
    <div>
      {props.allStops.map((stops, index) => {
        return (
          <div key={`${props.busStops[index]}_${index}`}>
            <h2>
              <a
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
                X
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

const App = () => {
  const [user] = useAuthState(auth)

  // const busStops = [16086, 16085, 877, 16111, 16183, 49881, 41243]

  const initAllStops = [[{ Actual: false, DepartureText: 'Loading...' }]]

  const [allStops, setAllStops] = useState([initAllStops])

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
          className="delete"
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
      <header className="App-header">
        <Clock />
      </header>
      {user ? (
        <>
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
        </>
      ) : (
        <SignIn />
      )}
    </div>
  )
}

export default App
