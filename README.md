# strava-segment-validator

Strava segments are hotly contested for the all-useless KOM and QOM titles. However, while the vast majority train hard and/or spend lots of money on "fast" bikes, the advent of e-bikes, cheaters on mopeds, as well as simple GPS and tracking mistakes mean that from time to time, someone will claim a KOM or QOM title without having geninely earned it.

Disclaimer: this is just an experiment; this project is not designed to restore justice to anyone's Strava e-mojo. 

# What makes an invalid effort on a Strava segment?

1. GPS inconsistencies can falsely indicate very high speeds when the signal is synced up; in practice this means that on a straight segment you could accidentally take KOM.
2. Continuing to track an activity in the car or on some other motorised vehicle.

# What data can be leveraged to indicate invalid efforts? 

The segment and its leaderboard can be inspected:

- http://strava.github.io/api/v3/segments/
- http://strava.github.io/api/v3/segments/#leaderboard

1. Unusually low HR, cadence and (estimated) power readings.
2. A large distance between activity average and maximum speeds.
3. In the activity timeline, a pause, then a complete drop of HR / cadence information. Example: someone transitioning mode of transport. This doesn't appear to be something Strava offers through their API, though. 

Note that:
- the above points need to correct for activity gear and athlete weight, or lack thereof.
- Strava can't calculate accurately power if there is:
  - no athlete weight set
  - an accidental setting of MTB/hybrid bikes, especially for flat and uphill segments

# Some ideas:

It might be useful to manually find some invalid efforts, as well as use the below flags, to generate a training set of data to feed in to a neural network. 

1. Considering power over the duration of the segment. For longer segments, unusually high power is going to be easy to flag: https://cyclingtips.com/2009/07/just-how-good-are-these-guys/
2. Considering the effort athlete's (recent) stats: http://strava.github.io/api/v3/athlete/#stats 
3. Considering the whole activity's segment efforts and identifying a large shift in speed, even more so if there has been a pause in tracking.  

# What shouldn't be considered?

Sensors often report false readings due to some other technical problem, like a bad connection or poor conductivity. Therefore a low heart rate and cadence may not by themselves indicate an invalid effort.

# Useful links:

- Strava API: http://strava.github.io/api/
- Your API client: https://www.strava.com/settings/api
- Strava SDK in Node: https://github.com/UnbounDev/node-strava-v3
