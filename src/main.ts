namespace dattoro
{
    export function samplesToSeconds(sampleRate: number, samples: number) : number
    {
        return samples / sampleRate;
    }
    export class LowPassFilter
    {
        private _input:  GainNode;
        private _feedback: GainNode;
        private _feedbackGain: GainNode;
        private _delay: DelayNode;

        constructor(ctx:  AudioContext, public gain: number, invertGain: boolean = false)
        {
            this._input = ctx.createGain();
            this._input.gain.value = invertGain? gain : 1 - gain;
            this._feedback = ctx.createGain();
            this._feedbackGain = ctx.createGain();
            this._feedbackGain.gain.value = invertGain? 1 - gain : gain;
            this._delay = ctx.createDelay();
            this._delay.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 1);

            //connect internals
            this._input.connect(this._feedback);
            this._feedback.connect(this._delay);
            this._delay.connect(this._feedbackGain);
            this._feedbackGain.connect(this._feedback);
        }

        public getIn() : GainNode
        {
            return this._input;
        }

        public getOut() : GainNode
        {
            return this._feedback;
        }

        public connectIn(node: AudioNode)
        {
            node.connect(this._input);
        }

        public connect(node: AudioNode)
        {
            this._feedback.connect(node);
        }
    }
}
/*

constant params

*/
var params = {
    predelay : 0.01, // samples
    bandwidth : 0.9995,
    decay : 0.5,
    decayDiffusion_1 : 0.6,
    decayDiffusion_2 : 0.7,
    inputDiffusion_1 : 0.5,
    inputDiffusion_2 : 0.6,
    damping : 0.01
}

var div = document.getElementById("gui");
var gui = new dat.GUI({autoPlace: true});
if(div)
{
    div.appendChild(gui.domElement);
}

/*
gui.add(params, 'predelay', 0.0, 1000);
gui.add(params, 'bandwidth', 0.0, 0.9);
gui.add(params, 'decay', 0.1, 10.0);
gui.add(params, 'decayDiffusion_1', 0, 1);
gui.add(params, 'decayDiffusion_1', 0, 1);
gui.add(params, 'inputDiffusion_1', 0,1);
gui.add(params, 'inputDiffusion_1', 0, 1);
gui.add(params, 'damping', 0.0, 1.0).step(0.0001);*/

/*

CREATE NODES

*/
// create audio context
var ctx: AudioContext = new AudioContext();
// load audio file with XHR
var bufferSource = ctx.createBufferSource();

// predelay
var predelayNode = ctx.createDelay();
predelayNode.delayTime.value = params.predelay;

// lpf1
//var lpf1 = new dattoro.LowPassFilter(ctx, params.bandwidth);
var lpf1 = ctx.createBiquadFilter();
lpf1.type = "lowpass";
lpf1.frequency.value = 500.0;
lpf1.gain.value = params.bandwidth;

// apf1
var apf1 = new dattoro.AllPassFilter(ctx, 142, params.inputDiffusion_1);

// apf2
var apf2 = new dattoro.AllPassFilter(ctx, 107, params.inputDiffusion_1);

// apf3
var apf3 = new dattoro.AllPassFilter(ctx, 379, params.inputDiffusion_2);

// apf4
var apf4 = new dattoro.AllPassFilter(ctx, 277, params.inputDiffusion_2);

// TANK 1

// tankSum_1
var tankSum_1 = ctx.createGain();
// apf5
var apf5 = new dattoro.AllPassFilter(ctx, 672, params.decayDiffusion_1, -1.0);
// tankDelay_1
var tankDelay_1 = ctx.createDelay();
tankDelay_1.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 4453);
// lpf2
//var lpf2 = new dattoro.LowPassFilter(ctx, params.damping, true);
var lpf2 = ctx.createBiquadFilter();
lpf2.type = "lowpass";
lpf2.frequency.value = 500.0;
lpf2.gain.value = params.damping;

// tankDecay_1
var tankDecay_1 = ctx.createGain();
tankDecay_1.gain.value = params.decay;
// apf 6
var apf6 = new dattoro.AllPassFilter(ctx, 1800,params.decayDiffusion_2);

// TANK 2

// tankSum_2
var tankSum_2 = ctx.createGain();
// apf5_prime
var apf5_prime = new dattoro.AllPassFilter(ctx, 672, params.decayDiffusion_1, -1.0);
// tankDelay_2
var tankDelay_2 = ctx.createDelay();
tankDelay_2.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 4217);
// lpf2_prime
//var lpf2_prime = new dattoro.LowPassFilter(ctx, params.damping, true);
var lpf2_prime = ctx.createBiquadFilter();
lpf2_prime.type = "lowpass";
lpf2_prime.frequency.value = 500.0;
lpf2_prime.gain.value = params.damping;
// tankDecay_1
var tankDecay_2 = ctx.createGain();
tankDecay_2.gain.value = params.decay;
// apf6_prime
var apf6_prime = new dattoro.AllPassFilter(ctx, 2656,params.decayDiffusion_2);

/** tank 1 -> tankSum_2 */
// feedback 1
var feedbackDelay_1 = ctx.createDelay();
feedbackDelay_1.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 3720);
// feedback decay 1
var feedbackDecay_1 = ctx.createGain();
feedbackDecay_1.gain.value = params.decay;

/** tank 2 -> tankSum_1 */
// feedback 2
var feedbackDelay_2 = ctx.createDelay();
feedbackDelay_2.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 3163);
// feedback decay 2
var feedbackDecay_2 = ctx.createGain();
feedbackDecay_2.gain.value = params.decay;

/** output taps */
var n_out_1 = ctx.createGain();
var n_out_2 = ctx.createGain();
var n_out_3 = ctx.createGain();
var n_out_4 = ctx.createGain();
var n_out_5 = ctx.createGain();
var n_out_6 = ctx.createGain();

/** accumulators */
var delay_L_1 = ctx.createDelay();
var  gain_L_1 = ctx.createGain();
var delay_L_2 = ctx.createDelay();
var  gain_L_2 = ctx.createGain();
var delay_L_3 = ctx.createDelay();
var  gain_L_3 = ctx.createGain();
var delay_L_4 = ctx.createDelay();
var  gain_L_4 = ctx.createGain();
var delay_L_5 = ctx.createDelay();
var  gain_L_5 = ctx.createGain();
var delay_L_6 = ctx.createDelay();
var  gain_L_6 = ctx.createGain();
var delay_L_7 = ctx.createDelay();
var  gain_L_7 = ctx.createGain();
delay_L_1.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 266);
delay_L_2.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 2974);
delay_L_3.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 1913);
delay_L_4.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 1996);
delay_L_5.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 1990);
delay_L_6.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 187);
delay_L_7.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 1066);
gain_L_1.gain.value = 1.0;//0.6;
gain_L_2.gain.value = 1.0;//0.6;
gain_L_3.gain.value = -1.0;//-0.6;
gain_L_4.gain.value = 1.0;//0.6;
gain_L_5.gain.value = -1.0;//-0.6;
gain_L_6.gain.value = -1.0;//-0.6;
gain_L_7.gain.value = -1.0;//-0.6;

var left_sum = ctx.createGain();

var delay_R_1 = ctx.createDelay();
var  gain_R_1 = ctx.createGain();
var delay_R_2 = ctx.createDelay();
var  gain_R_2 = ctx.createGain();
var delay_R_3 = ctx.createDelay();
var  gain_R_3 = ctx.createGain();
var delay_R_4 = ctx.createDelay();
var  gain_R_4 = ctx.createGain();
var delay_R_5 = ctx.createDelay();
var  gain_R_5 = ctx.createGain();
var delay_R_6 = ctx.createDelay();
var  gain_R_6 = ctx.createGain();
var delay_R_7 = ctx.createDelay();
var  gain_R_7 = ctx.createGain();

delay_R_1.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 353);
delay_R_2.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 3627);
delay_R_3.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 1228);
delay_R_4.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 2673);
delay_R_5.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 2111);
delay_R_6.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 335);
delay_R_7.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, 121);
gain_R_1.gain.value = 1.0;//0.6;
gain_R_2.gain.value = 1.0;//0.6;
gain_R_3.gain.value = -1.0;//-0.6;
gain_R_4.gain.value = 1.0;//0.6;
gain_R_5.gain.value = -1.0;//-0.6;
gain_R_6.gain.value = -1.0;//-0.6;
gain_R_7.gain.value = -1.0;//-0.6;

var right_sum = ctx.createGain();

var left_output = ctx.createStereoPanner();
left_output.pan.value = -1.0;

var right_output = ctx.createStereoPanner();
right_output.pan.value = 1.0;

/*

CONNECT REVERB

*/

function connectDattoro(node: AudioBufferSourceNode)
{
    node.connect(predelayNode);

    predelayNode.connect(lpf1);
    lpf1.connect(apf1.getIn());
    apf1.connectFilterOut(apf2.getIn());
    apf2.connectFilterOut(apf3.getIn());
    apf3.connectFilterOut(apf4.getIn());

    //tank 1
    apf4.connectFilterOut(tankSum_1);
    tankSum_1.connect(apf5.getIn());
    apf5.connectFilterOut(tankDelay_1);
    tankDelay_1.connect(lpf2);
    lpf2.connect(tankDecay_1);
    tankDecay_1.connect(apf6.getIn());
    apf6.connectFilterOut(feedbackDelay_1);
    feedbackDelay_1.connect(feedbackDecay_1);
    feedbackDecay_1.connect(tankSum_2);

    //tank 2
    apf4.connectFilterOut(tankSum_2);
    tankSum_1.connect(apf5_prime.getIn());
    apf5_prime.connectFilterOut(tankDelay_2);
    tankDelay_2.connect(lpf2_prime);
    lpf2_prime.connect(tankDecay_2);
    tankDecay_2.connect(apf6_prime.getIn());
    apf6_prime.connectFilterOut(feedbackDelay_2);
    feedbackDelay_2.connect(feedbackDecay_2);
    feedbackDecay_2.connect(tankSum_1);

    //output taps
    apf5.connectDelayOut(n_out_1);
    lpf2.connect(n_out_2);
    apf6.connectDelayOut(n_out_3);
    apf5_prime.connectDelayOut(n_out_4);
    lpf2_prime.connect(n_out_5);
    apf6_prime.connectDelayOut(n_out_6);

    // connect taps to left accumulators
    n_out_4.connect(delay_L_1);
    n_out_4.connect(delay_L_2);
    n_out_5.connect(delay_L_3);
    n_out_6.connect(delay_L_4);
    n_out_1.connect(delay_L_5);
    n_out_2.connect(delay_L_6);
    n_out_3.connect(delay_L_7);

    // connect taps to right accumulators
    n_out_1.connect(delay_R_1);
    n_out_1.connect(delay_R_2);
    n_out_2.connect(delay_R_3);
    n_out_3.connect(delay_R_4);
    n_out_4.connect(delay_R_5);
    n_out_5.connect(delay_R_6);
    n_out_6.connect(delay_R_7);

    // connect accumulator delays to phase inverters
    delay_L_1.connect(gain_L_1);
    delay_L_2.connect(gain_L_2);
    delay_L_3.connect(gain_L_3);
    delay_L_4.connect(gain_L_4);
    delay_L_5.connect(gain_L_5);
    delay_L_6.connect(gain_L_6);
    delay_L_7.connect(gain_L_7);
    delay_R_1.connect(gain_R_1);
    delay_R_2.connect(gain_R_2);
    delay_R_3.connect(gain_R_3);
    delay_R_4.connect(gain_R_4);
    delay_R_5.connect(gain_R_5);
    delay_R_6.connect(gain_R_6);
    delay_R_7.connect(gain_R_7);
    gain_L_1.connect(left_sum);
    gain_L_2.connect(left_sum);
    gain_L_3.connect(left_sum);
    gain_L_4.connect(left_sum);
    gain_L_5.connect(left_sum);
    gain_L_6.connect(left_sum);
    gain_L_7.connect(left_sum);
    gain_R_1.connect(right_sum);
    gain_R_2.connect(right_sum);
    gain_R_3.connect(right_sum);
    gain_R_4.connect(right_sum);
    gain_R_5.connect(right_sum);
    gain_R_6.connect(right_sum);
    gain_R_7.connect(right_sum);

    left_sum.connect(left_output);
    right_sum.connect(right_output);
    
    left_output.connect(ctx.destination);
    right_output.connect(ctx.destination);
}

/*

GARDNER

*/



var request = new XMLHttpRequest();
request.open('GET', '80s_vibe.mp3');
request.responseType = 'arraybuffer';
request.onload = function() {
    var audioData = request.response;
    // decode audio file data via the context
    ctx.decodeAudioData(audioData, function(buffer){
        bufferSource.buffer = buffer;
        //var buffGain = ctx.createGain();
        connectDattoro(bufferSource);
        //var _lpf = new dattoro.LowPassFilter(ctx, 0.75, true);
        //var _lpf = new dattoro.AllPassFilter(ctx, 0, 0.8);
        //bufferSource.connect(ctx.destination);
        //gui.add(buffGain.gain, 'value');
        //_lpf.connectFilterOut(ctx.destination);
        bufferSource.start();
    })   
}
request.send();
