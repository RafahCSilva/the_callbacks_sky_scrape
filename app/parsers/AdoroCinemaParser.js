const request = require('request');
const cheerio = require('cheerio');
const rp = require('request-promise');
const _ = require('lodash')
//const Committer = require('./../lib/committer');
serie = _.cloneDeep(require('./../models/serie.js'));
movie = _.cloneDeep(require('./../models/movie.js')); 
site = 'http://www.adorocinema.com';
const Committer = require('../lib/committer')

cSerie = ''; 
flag = true;


async function screape(name){    
    s = ""; 
    pesquisa = site + "/busca/?q="+ name.replace(' ', '+');
    try{ 
    
       let html = await rp.get(pesquisa);
 
       const $ = cheerio.load(html);

        s = $('table.totalwidth.noborder.purehtml tr a').attr('href');
        //console.log(s);
        flag = s.charAt(1)!='f';
        if (flag){
            await start(s);
        }
        
        if(!flag){
            await start2(s);
        }
        
        
    } catch(err){
        console.log("Serie indisponivel: " + err.message);
        
    }
    
    let committer = new Committer()
   
    if(flag){
        committer.post({
            title: name,
            source: 'adorocinema',
            result: serie
        })   
        return serie;
    }else{
        committer.post({
            title: name,
            source: 'adorocinema',
            result: movie
        }) 
        return movie;
    }
}

module.exports = screape

async function start(s){
    cSerie = s; 
    try{
        let html = await rp.get(site+cSerie); 
        const $ = cheerio.load(html);
    
        serie.technicalDetails.movieName = $('#title > span.tt_r26.j_entities').text().trim();
        serie.technicalDetails.releaseYear = $('#contentlayout > div.posterLarge > div > div > div > table > tbody > tr:nth-child(1) > td').text().trim();
        serie.technicalDetails.durationaverage = $('#contentlayout > div.posterLarge > div > div > div > table > tbody > tr:nth-child(6) > td').text().trim();
        serie.technicalDetails.status = $('#contentlayout > div.posterLarge > div > div > div > table > tbody > tr:nth-child(5) > td').text().trim();
    
    
        serie.about.sinposis = $('#col_main > div.margin_30t.margin_20b > p:nth-child(3)').text().trim();  
        serie.about.rating = $('#contentlayout > div.posterLarge > div > div > div > table > tbody > tr:nth-child(7) > td > span > span.note').text().trim();
   
        var genres = [];
        $('#contentlayout > div.posterLarge > div > div > div > table > tbody > tr:nth-child(4) > td span').each(function (i,j) {
            genres.push($(j).text().trim());
        });
    
        serie.about.genre = genres.filter(function(elem, pos) {
                return genres.indexOf(elem) == pos;
        });
    
    
        await findSeasonsInfo(site, cSerie);
        
        await findImages(site, cSerie);

      
          //  console.log(serie.technicalDetails);      
        
    }catch(err){
        console.log("Dados da Serie indisponivel: " + err.message);
    }
    
        
}

async function findImages(site, cSeries){

    try{
        let html = await rp.get(site+cSerie+'fotos/'); 
    
        const $ = cheerio.load(html);
        $('div.list_photo.list_img100_by6 > ul > li > a > img').each(function (i,el) {
            s = $(el).attr('data-attr');
            serie.media.promoImages.push(s.substring(8,s.lenght).replace('"}', '').replace('/c_100_100', ''));
        });
        
    }catch(err){
        console.log("Imagens  indisponiveis: " + err.message);
    }
        
}


async function findSeasonsInfo(site, cSerie){
    var count = 0;
    
     try{
        let html = await rp.get(site+cSerie+"temporadas/"); 
        const $ = cheerio.load(html);
        let arr = []
        
        $('#col_main > ul li a.no_underline').each(function(i,j){
                count = count+1;

                var sLink =  $(j).attr('href');
                var sNum = $(j).text().split(' ')[1].trim();
                
                serie.seasons.push({
                    number: "",
                    year: "",
                    totalEpisodes: "",
    
                media: {
                    poster: "",
                    trailers: [],
                    promoVideos: [],
                    backdropImages: [],
                    promoImages: [],
                    screenshots: []
    
                },
    
                cast: {
                    director: [],
                    creator: [],
                    production: [],
                    script: [],
                    list: [{
                        name: "",
                        sex: "",
                        character: "",
                        voiceActor: ""
                    }]
                },

                episodes: [{
                    name: "",
                    number: "", 
                    director: "", 
                    creator: "",
                    sinposis: "", 
                    screenshots: []
        
                }]});
                //Buscar dados de ep. de cada temp.
               arr.push(findEpisodesInfo(sLink, sNum));

               return Promise.all(arr)
            });
        }catch(err){
            console.log("Imagens  indisponiveis: " + err.message);
        }
        
        var seasonsInfo =  { total: "" };

        serie.technicalDetails.totalSeasons = count;

}




async function findEpisodesInfo(sLink, sNum) {
  
    var n = serie.seasons.length-1;
    serie.seasons[n].number = sNum;
    
   
   //Nomes de eps
   try{
        let html = await rp.get(site+sLink); 
        const $ = cheerio.load(html);
        
        
        serie.seasons[n].totalEpisodes = $('.episodes_list_inner table tbody tr span.episode-title').length
        $('.episodes_list_inner table tbody tr span.episode-title').each(function(i,j){
    
            serie.seasons[n].episodes.push( {
                    name: "",
                    number: "", 
                    director: "", 
                    creator: "",
                    sinposis: "", 
                    screenshots: []
        
                });

            serie.seasons[n].episodes[i].name = $(j).text().trim();
            serie.seasons[n].episodes[i].number = serie.seasons[n].totalEpisodes - i;
         });
         
         
    }catch(err){
        console.log("Nomes indisponiveis: " + err.message);
    }
        
        
        
    
       //Nomes de elenco
    try{
        let html = await rp.get(site+sLink+'elenco/'); 
        
        const $ = cheerio.load(html);
            
        //creators
        creators = []
        $('div.Creator li[itemprop="creator"]').each(function(i,j){
            creators.push($(j).text().trim().split('\n')[0]);    
         
         });
         
        serie.seasons[n].cast.creator = creators.filter(function(elem, pos) {
            return creators.indexOf(elem) == pos;
        });
         
         
        //Actors
        actors = [];
        $('div.Actors li[itemprop="actor"]').each(function(i,j){
        
                lines =  $(j).text().trim().split('\n');
                actors.push( {
                    
                    name: lines[0],
                    sex: "",
                    character:  lines[lines.length-1].split(' ')[1],
                    voiceActor: ""
                });
        });
        
       
        serie.seasons[n].cast.list = actors.filter(function(elem, pos) {
            return actors.indexOf(elem) == pos;
        });       
                
         
         
         
         //Directors 'table.Directors > tbody td:nth-child(3) '
        directors = [];
        
        $('table.Directors td:nth-child(3)').each(function(i,j){
            directors.push($(j).text().trim());             
        });
         
         
        serie.seasons[n].cast.director = directors.filter(function(elem, pos) {
            return directors.indexOf(elem) == pos;
        });
                      
         //Producers table.Producers > tbody td:nth-child(3)
        producers = [];
        
        $('table.Producers td:nth-child(3)').each(function(i,j){
            producers.push($(j).text().trim());             
        });
         
         
        serie.seasons[n].cast.production = producers.filter(function(elem, pos) {
            return producers.indexOf(elem) == pos;
        });
                      
         
         //Roteiros table.Screenplay > tbody td:nth-child(3) 
         
        screenplay = [];
        
        $('table.Screenplay td:nth-child(3)').each(function(i,j){
            screenplay.push($(j).text().trim());             
        });
         
         
        serie.seasons[n].cast.script = screenplay.filter(function(elem, pos) {
            return screenplay.indexOf(elem) == pos;
        });
         
             
    }catch(err){
        console.log("Nomes indisponiveis: " + err.message);
    }
    
            
}






async function start2(s){
    cSerie = s; 
    try{
        let html = await rp.get(site+cSerie); 
        const $ = cheerio.load(html);
    
        movie.technicalDetails.movieName = $('#content-layout > div > div.row.row-col-padded > div > div > div.titlebar-title.titlebar-title-lg').text().trim();
        movie.technicalDetails.releaseYear = $('#synopsis-details > div.ovw-synopsis-info > div.more-hidden > div:nth-child(1) > span.that').text().trim();
        movie.technicalDetails.originalName = $('#synopsis-details > div.ovw-synopsis-info > div:nth-child(1) > h2').text().trim(); 
        movie.technicalDetails.originalLanguage = $('#synopsis-details > div.ovw-synopsis-info > div.more-hidden > div:nth-child(6) > span.that').text().trim();  

       // movie.technicalDetails.durationaverage = $('div.meta-body-item > a').text;
        
        movie.about.sinposis = $('#synopsis-details > div.synopsis-txt > p').text().trim();
        movie.cast.directors.push($('#content-start > div > div > div.card.card-entity.card-movie-overview.row.row-col-padded-10.cf > div > div.meta-body > div:nth-child(2) > span:nth-child(2) > a > span').text()); 
        
        var genres = $('#content-start > div > div > div.card.card-entity.card-movie-overview.row.row-col-padded-10.cf > div > div.meta-body > div:nth-child(4)').text().split('\n');
        for(i=2; i < genres.length-1; i = 1+i){
            movie.about.genre.push(genres[i].trim().replace(',', '') );
        }
        
      
            
        
        
//        console.log( $('#content-start > div > div > div.card.card-entity.card-movie-overview.row.row-col-padded-10.cf > div > div.meta-body > div:nth-child(4)').text().split(' ').
        
            
    /*
        serie.about.sinposis = $('#col_main > div.margin_30t.margin_20b > p:nth-child(3)').text().trim();  
        serie.about.rating = $('#contentlayout > div.posterLarge > div > div > div > table > tbody > tr:nth-child(7) > td > span > span.note').text().trim();
   
        var genres = [];
        $('#contentlayout > div.posterLarge > div > div > div > table > tbody > tr:nth-child(4) > td span').each(function (i,j) {
            genres.push($(j).text().trim());
        });
    
        serie.about.genre = genres.filter(function(elem, pos) {
                return genres.indexOf(elem) == pos;
        });
    */
    
      //  await findSeasonsInfo(site, cSerie);
        
      //  await findImages(site, cSerie);

      
          //  console.log(serie.technicalDetails);      
        
    }catch(err){
        console.log("Dados da Serie indisponivel "+ err.message);
    }
    
        
}

