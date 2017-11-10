namespace dattoro
{
    export class AllPassFilter
    {
        private _input: GainNode;
        private _inputSum:  GainNode;
        private _outputSum: GainNode;
        private _posGain: GainNode;
        private _negGain: GainNode;
        private _delay: DelayNode;

        constructor(ctx:  AudioContext, public delay: number, public gain: number, phaseFlip: number = 1.0)
        {
            this._input = ctx.createGain();
            this._inputSum = ctx.createGain();
            this._outputSum = ctx.createGain();
            this._posGain = ctx.createGain();
            this._posGain.gain.value = -gain * phaseFlip;
            this._negGain = ctx.createGain();
            this._negGain.gain.value = gain * phaseFlip;

            this._delay = ctx.createDelay();
            this._delay.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, delay);

            //connect internals
            /*
            this._inputSum.connect(this._delay);
            this._inputSum.connect(this._posGain);
            this._posGain.connect(this._outputSum);
            this._negGain.connect(this._inputSum);
            this._delay.connect(this._negGain);
            this._delay.connect(this._outputSum);*/

            
            this._input.connect(this._negGain);
            this._negGain.connect(this._outputSum);
            this._inputSum.connect(this._delay);
            this._delay.connect(this._outputSum);
            this._outputSum.connect(this._posGain);
            this._posGain.connect(this._inputSum);
            
        }

        public getIn() : GainNode
        {
            return this._input;
        }

        public getFilterOut() : GainNode
        {
            return this._outputSum;
        }

        public getTapOut() : DelayNode
        {
            return this._delay;
        }

        public connectIn(node: AudioNode)
        {
            node.connect(this._input);
        }
        public connectFilterOut(node: AudioNode)
        {
            this._outputSum.connect(node);
        }
        public connectDelayOut(node: AudioNode)
        {
            this._delay.connect(node);
        }
    }
}