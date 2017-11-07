namespace dattoro
{
    export class AllPassFilter
    {
        private _inputSum:  GainNode;
        private _outputSum: GainNode;
        private _posGain: GainNode;
        private _negGain: GainNode;
        private _delay: DelayNode;

        constructor(ctx:  AudioContext, public delay: number, public gain: number)
        {
            this._inputSum = ctx.createGain();
            this._outputSum = ctx.createGain();
            this._posGain = ctx.createGain();
            this._posGain.gain.value = gain;
            this._negGain = ctx.createGain();
            this._negGain.gain.value = -gain;

            this._delay = ctx.createDelay();
            this._delay.delayTime.value = dattoro.samplesToSeconds(ctx.sampleRate, delay);

            //connect internals
            this._inputSum.connect(this._delay);
            this._inputSum.connect(this._posGain);
            this._posGain.connect(this._outputSum);
            this._negGain.connect(this._inputSum);
            this._delay.connect(this._negGain);
            this._delay.connect(this._outputSum);
        }

        public connectIn(node: AudioNode)
        {
            node.connect(this._inputSum);
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