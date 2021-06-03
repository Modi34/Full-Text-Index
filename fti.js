class FullTextIndex{
    data = {}
    words = []
    texts = []
    textsIds = []
    wordsInText = {}
    wordsRelations = {}

    constructor(allowedCharacters){
        this.allowedCharacters = allowedCharacters
    }

    index(text, text_id){
        let words = this.extractWords(text);
        let ti = []
        this.textsIds.push(text_id)
        let prevId = '';
        for(let word of words){
            let id = this.words.indexOf(word);
            if(!(prevId in this.wordsRelations)){
                this.wordsRelations[prevId] = []
            }
            if(id == -1){
                id = this.words.length;

                this.words.push(word)

                for(let level in word){
                    let letter = word[level];
                    if(!this.data[letter]){
                        this.data[letter] = {};
                    }
                    if(!this.data[letter][id]){
                        this.data[letter][id] = [];
                    }
                    this.data[letter][id].push( Number(level) );
                }
            }

            this.wordsRelations[prevId].push(id)
            prevId = id
            ti.push(id)
            if(!(id in this.wordsInText)){
                this.wordsInText[id] = []
            }
            this.wordsInText[id].push(this.texts.length)
        }
        this.texts.push(ti)
    }

    rebuildWords(){
        let data = this.data;
        let result = [];

        for(let letter in data){
            let words = data[letter];
            for(let id in words){
                let positions = words[id]
                for(let position of positions){
                    if(!result[id]){
                        result[id] = []
                    }
                    result[id][position] = letter;
                }
            }
        }
        this.words = result.map(word => word.join(''))
    }

    findWord(word){
        let lastPosition = {};
        let occurence = {};
        let result = {}

        for(let letter of word){
            let ids = this.data[letter];

            if(letter in occurence){
                occurence[letter]++
            }else{
                occurence[letter] = 0
            }

            let lastOccurence = occurence[letter]
            for(let id in ids){
                let position = ids[id][lastOccurence];

                if(position > lastPosition[id]){
                    result[id]++;
                }else if(!result[id]){
                    result[id] = position ? 1 : 2;
                }

                lastPosition[id] = position;
            }
        }

        let exact;
        let close = []
        for(let id in result){
            let currentWord = this.words[id];
            let wordResults = {id, word: currentWord, score: result[id]}
            if(word == currentWord){
                exact = wordResults
            }else{
                close.push(wordResults)
            }
        }

        close.sort((a, b) => b.score - a.score)
        result = {exact, close}

        return result
    }

    findText(word){
        let texts = {exact: false, close: []};
        if(word.exact){
            texts.exact = this.wordsInText[word.exact.id]
        }
        for(let d of word.close){
            texts.close.push(this.wordsInText[d.id])
        }

        return texts
    }

    search(text){
        let words = this.extractWords(text);
        let results = [];
        let scores = []
        let r = [];
        for(let word of words){
            let score = this.findWord(word);
            scores.push(score)
            let p = this.findText(score);
            results.push(p)
            if(p.exact){
                r.push(...p.exact)
            }else{
                r.push(...p.close[0])
            }
        }
        return [...new Set(r)].map(match => this.textsIds[match])
    }

    extractWords(text){
        text = text.toLowerCase() + ' ';
        let results = [];

        let word = '';
        for(let letter of text){
            if(this.allowedCharacters.contain[letter]){
                word += letter;
            }else if(word){
                results.push( word );
                word = ''
            }
        }

        return results
    }
}

class CharRange {
    contain = {};
    constructor(...ranges){
        for(let range of ranges)
            this.add(range.charCodeAt(0), range.charCodeAt(1))
    }
    add(start, end){
        while(start <= end)
            this.contain[ String.fromCharCode( start ) ] = start++
    }
}


let db = new FullTextIndex(new CharRange('az', 'ая'));

let text = `context Text unique word tent`;
let text2= `test Text weird work`;

db.index(text, 'eng 1')
db.index(text2, 'eng 2')

console.log(db.search('text'))