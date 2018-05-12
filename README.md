# Voyager Record Decoder

Github hosted [DEMO HERE](https://maltegruberprivate.github.io/voyager-record-decoder).

## Operation
The data from the Voyager record is downloaded as a .mp3 file. This file is converted into a two arrays holding floating point PCM samples of the right and left channels. These channels are then scanned for *sync* pulses. This is done in a very crude way, the array of a channel is scanned for a pulse that is higher than the local samples. This works *more often than not* but it is limited by some artifacts in the audio file described below.

## Audio file filtering artifacts
The audio file contains artifacts that indicate that the audio signal has been filtered. As illustrated in the following figure, it looks as the audio has been processed with a high pass filter. The example shown here is for the circle, the two peaks in the middle represent the dark parts of the circle. To the left is the sync pulse. Note that when there is a DC section with little change the signal tends towards zero. And sudden changes "pull" the DC level with them.

![High pass filtering illustration](/doc/voyager-lp.png)

This is likely an artifact produced during digitizing. Most likely the recorder was an audio recorder with a DC blocking filter. It could also be that this is a part of the encoding process which I am not understanding. It is visible in the images that I produce and other experience the [same](https://boingboing.net/2017/09/05/how-to-decode-the-images-on-th.html). Here is an example were the skewing is visible as well as the "DC-pull" after strong changes in image intensity.

![High pass filtering effects on image](/doc/numbers.png)

## RGB Images
There are RGB images on the record. These are stored as three separate images for the individual color channels. This is not handled in this implementation.
