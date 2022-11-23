# MedMCQ import

Dette er en samling scripts, der konverterer et WiseFlow-eksport til en struktur, AU MCQ kan håndtere.

Derefter kan disse JSON-filer (fra ouput-mappen) uploades til AU MCQ.

## Input

Skal være en `json`-fil indeholdende et array af flows (se [src/Interfaces/Flow.ts](src/interfaces/Flow.ts) for strukturen).

## Output

Er en graph af følgende struktur (se [src/utils/parseFlow.ts](src/utils/parseFlow.ts) for detaljer):

```
{
    semesterId,
    season,
    year,
    questions: [
        {
            text,
            answer1,
            answer2,
            answer3,
            image,
            correctAnswers: [
                { answer }
            ],
            examSetQno
        }, ... 
    ]

}
```

Filerne gemmes i `output`-mappen sammen med evt. billeder.

## Installation
NB: Brug git bash, ikke PowerShell
1. `npm install`
2. `npm run build`


## Brug
***Anvend git bash!!***

Hvis input-filen, input.json, ligger i en undermappe kaldet '/imports'...
1. `npm run convert .`
2. Angiv input som imports/input.json
3. Følg guiden
4. JSON-filen i output uploades på MedMCQ
5. De nye filer i 'output/images' uploades på serveren fx via scp eller Filezilla