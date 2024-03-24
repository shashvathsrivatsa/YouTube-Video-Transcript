const ytdl = require('ytdl-core');
const xml2js = require('xml2js');

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
const port = 3000;

async function getTranscript(url) {
    try {
        const info = await ytdl.getInfo(url);

        if (!('captions' in info.player_response)) {
            return;
        }

        const subtitlesUrl = info.player_response.captions.playerCaptionsTracklistRenderer.captionTracks[0].baseUrl;
        const response = await fetch(subtitlesUrl);
        const data = await response.text();
        
        return new Promise((resolve, reject) => {
            xml2js.parseString(data, (err, result) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    const transcript = result.transcript.text
                        .map(item => item._).join(' ')
                        .replace(/&#39;/g, "'")
                        .replace(/i /g, 'I ')
                        .replace(/ \[Music\]/g, '');

                    resolve(transcript);
                }
            });
        });

    } catch (error) {
        console.error(error);
    }
}

app.get('/', (req, res) => {
    res.send('wazzuup');
});

app.get('/transcript', async (req, res) => {
    const videoId = req.query.v;
    if (!videoId) {
        return res.status(400).send('Missing video ID parameter');
    }

    try {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const transcript = await getTranscript(url);
        res.send(transcript);
    } catch (error) {
        res.status(500).send('Error getting transcript');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});