"use strict";
var dattoro;
(function (dattoro) {
    var AllPassFilter = (function () {
        function AllPassFilter(ctx, delay, gain) {
            this.delay = delay;
            this.gain = gain;
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
        AllPassFilter.prototype.connectIn = function (node) {
            node.connect(this._inputSum);
        };
        AllPassFilter.prototype.connectFilterOut = function (node) {
            this._outputSum.connect(node);
        };
        AllPassFilter.prototype.connectDelayOut = function (node) {
            this._delay.connect(node);
        };
        return AllPassFilter;
    }());
    dattoro.AllPassFilter = AllPassFilter;
})(dattoro || (dattoro = {}));
var dattoro;
(function (dattoro) {
    function samplesToSeconds(sampleRate, samples) {
        return samples / sampleRate;
    }
    dattoro.samplesToSeconds = samplesToSeconds;
})(dattoro || (dattoro = {}));
