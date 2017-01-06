'use strict';

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const strava = require('strava-v3');

fs.readFileAsync(path.resolve(__dirname, 'etc', '8340386.json')).then(file => {
    const efforts = JSON.parse(file.toString());
    const sample = efforts.entries.sort((a, b) => a.rank < b.rank? -1 : 1).filter(effort => effort.rank <= 10);
    return Promise.all(sample.map(effort => fillEffortData(effort, sample))).then(efforts => {
        console.log(efforts.map((effort, position) => calculate(effort, position, efforts)));
    });
});

/**
 * For a given effort, assign a dodginess score by iterating through the scorer functions.
 * @param {{}} effort
 * @param {Number} position
 * @param {[]} efforts
 * @returns {{}}
 */
function calculate(effort, position, efforts) {
    const scorers = [scoreTime];
    return Object.assign(effort, {
        score: scorers.reduce((score, scoreFn) => score + scoreFn(effort, position, efforts), 0)
    });
}

/**
 * Inspect the standard deviation of the elapsed_time.
 * Create a threshold number for standard deviations which, if exceeded, causes an increase in dodginess score.
 * Rank increases the threshold travelling down the leaderboard.
 * Absence of HR and wattage decreases the threshold.
 * If the deviation between efforts is above the threshold, score 1.
 * @param {{}} effort
 * @param position
 * @param efforts
 * @returns {number}
 */
function scoreTime(effort, position, efforts) {
    const nextEffort = efforts[position + 1];
    let suspectThreshold = 2;
    let threshMod = 1;
    // if there is no HR or wattage, lower the deviation factor to make it stricter
    if (effort.average_hr === null) {
        threshMod -= .1;
    }
    if (effort.average_watts === null) {
        threshMod -= .1;
    }
    // increase leaniency as we go down the leaderboard ranking
    threshMod *= (1 + (0.02 * (effort.rank - 1)));
    suspectThreshold *= threshMod;
    console.log('scoreTime', 'modifier', threshMod);
    if (!nextEffort) { // todo: don't bail; look at the next effort
        return 0;
    }
    const timeDeviation = stdDev(pluck(efforts, 'elapsed_time'));
    const rangeDeviation = (nextEffort.elapsed_time - effort.elapsed_time) / timeDeviation;
    if (rangeDeviation > suspectThreshold) {
        console.log('scoreTime', 'flagging', 'rank', effort.rank, 'effort_id', effort.effort_id);
        return 1;
    }
    return 0;
}

function mean(values) {
    return sum(values) / values.length;
}

function sum(values) {
    return values.reduce((sum, value) => sum + value, 0);
}
function pluck(arrObjs, key) {
    return arrObjs.map(item => item[key]);
}

function stdDev(values) {
    const valueMean = mean(values);
    const variance = mean(values.map(value => (value - valueMean) ^ 2));
    return Math.sqrt(Math.abs(variance));
}

/**
 * Fetch all data needed for this effort
 * todo: Needs segment grade, athlete details, etc.
 * @param {{}} effort
 * @return Promise resolves with the effort
 */
function fillEffortData(effort) {
    const keys = [
        'effort_id',
        'activity_id',
        'distance',
        'elapsed_time',
        'average_watts',
        'average_hr',
        'rank',
        // 'device_watts',
        // 'max_heartrate',
        // 'average_cadence',
    ];
    return new Promise((resolve, reject) => {
        const info = keys.reduce(function(memo, key) {
            return Object.assign(memo, {
                [key]: effort[key]
            })
        }, {});
        // the distance varies depending on the segment effort: http://strava.github.io/api/v3/efforts/
        // this isn't the figure displayed on the website
        info.effort_speed = ((info.distance / 1000) / (info.elapsed_time / 3600));
        resolve(info);
    });
}
