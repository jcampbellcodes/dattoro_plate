namespace dattoro
{
    export function samplesToSeconds(sampleRate: number, samples: number) : number
    {
        return samples / sampleRate;
    }
}