const request = require('request');
const cheerio = require('cheerio');
serie = require('./../../models/serie.js');
site = 'http://www.adorocinema.com';

cSerie = ''; 
//cSerie = '/series/serie-7157/';
//cSerie = '/series/serie-11561/';
name = "Breaking bad";


function screape(){
    pesquisa = site + "/busca/?q="+ name.replace(' ', '+');
    try{ 
        request(pesquisa, function (error, response, html) {
 
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
            //console.log(html);
            
            //sSerie = $('table.totalwidth.noborder.purehtml tr a').attr('href');
            
            start($('table.totalwidth.noborder.purehtml tr a').attr('href'));
        }});
    }catch(err){
    
        console.log("Error");
    }
    


}
screape();


function start(s){
cSerie = s; 
request(site+cSerie, function (error, response, html) {
    if (!error && response.statusCode == 200) {
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
        
        
        findSeasonsInfo(site, cSerie);
        
        findImages(site, cSerie);

      
      //  console.log(serie.technicalDetails);
       

        
        
    }
});

}
function findImages(site, cSeries){
    request(site+cSerie+'fotos/', function (error, response, html) {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
            $('div.list_photo.list_img100_by6 > ul > li > a > img').each(function (i,el) {
                s = $(el).attr('data-attr');
                serie.media.promoImages.push(s.substring(8,s.lenght).replace('"}', '').replace('/c_100_100', ''));
            });
        
        console.log(serie.media.promoImages);
        }
    });

}


function findSeasonsInfo(site, cSerie){
    var count = 0;
    
    request(site+cSerie+"temporadas/", function (error, response, html) {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
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
                        trailers: [""],
                        promoVideos: [""],
                        backdropImages: [""],
                        promoImages: [""],
                        screenshots: [""]
        
                    },
        
                    cast: {
                        director: [""],
                        creator: [""],
                        production: [""],
                        script: [""],
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
                        screenshots: [""]
            
                    }]});
                    
                    
                    //Buscar dados de ep. de cada temp.
                   findEpisodesInfo(sLink, sNum);
                                
            
            });
        
        
        
        }
        
        var seasonsInfo =  { total: "" };

        serie.technicalDetails.totalSeasons = count;
    });

}




function findEpisodesInfo(sLink, sNum) {
  
   // console.log(sNum); 
    var n = serie.seasons.length-1;
    serie.seasons[n].number = sNum;
    
   
   //Nomes de eps
    request(site+sLink, function (error, response, html) {
        
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
            
            $('.episodes_list_inner table tbody tr span.episode-title').each(function(i,j){
 
                serie.seasons[n].episodes.push( {
                        name: "",
                        number: "", 
                        director: "", 
                        creator: "",
                        sinposis: "", 
                        screenshots: [""]
            
                    });
 
                serie.seasons[n].episodes[i].name = $(j).text();
             });
             
             
        }
    });
        
        
        
        
    
       //Nomes de elenco
    request(site+sLink+'elenco/', function (error, response, html) {
        if (!error && response.statusCode == 200) {
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
             
             
        }
    });
             
             
             
        
        
  //  });
    

}

