const express = require("express");
const bp = require("body-parser");
const session = require("express-session")
const bd = require("./config/config.js");
const app = express();
app.use('/css', express.static('css'))
app.use(bp.json())
app.use(bp.urlencoded({extended: true}))
//app.use('/assets', express.static('assets'))
const dirname='C:/Users/Utilizador/Desktop/UM/PW/pnsbin/templates'

const permittedLinker = ['localhost', '127.0.0.1','https://confident-austin-4f4f59.netlify.app' ,'http://pensbin21.freecluster.eu', 'http://pnsbin2.tk', process.env.IP]; // who can link here?
app.use(function(req, res, next) {
  let i = 0,
    notFound = 1,
    referer = req.get('Referer');
  if ((req.path === '/') || (req.path === '')) {
    res.send('{"message" : "Unauthorized access", "desc": "Your domain is not registered"}');
  } 
  if (referer) {
    while ((i < permittedLinker.length) && notFound) {
      notFound = (referer.indexOf(permittedLinker[i]) === -1);
      i++;
    }
  }
  if (notFound) {
    console.log("notfound");
    res.send('{"message" : "Unauthorized access", "desc": "Your domain is not registered"}');
  }
  else {
    next(); // access is permitted, go to the next step in the ordinary routing
  }
});

app.use(session({
	secret: 'pnsbn',
	resave: false,
	saveUninitialized: true,
	cookie:{
		secure: false,
		maxAge: 50000,
		httpOnly: true,
	}
}));

app.use(function(req,res,next){
	if(global.sessData==undefined){
		global.sessData=req.session;
		global.sessData.ID=req.sessionID;
	}else{
		console.log("session exists",global.sessData.ID);
	}
	next()
})

app.get('/', (req, res) => {
	res.sendFile(dirname+'/index.html')
});

app.get('/login',(req,res)=>{
	res.sendFile(dirname+'/form.html')
});

app.post('/login1',(req,res)=>{
	var name=req.body.nome
	var password=req.body.pw
	var post=[name,password]

	let sql='SELECT * from tecnico WHERE nome = ? AND password = ?'

	bd.connection.query(sql,post)
});

app.post('/login',(req,res)=>{
	var name=req.body.nome
	var password=req.body.pw
	var post=[name,password]

	let sql='SELECT * from tecnico WHERE nome = ? AND password = ?'

	if(name&&password){
	const techs=bd.connection.query(sql,post,function(error,results,fields){
		if(results.length>0){
			req.session.loggedIn=true;
			console.log("AUTH!",req.session.loggedIn);
			res.sendFile(dirname+'/tecnicos.html')
		}else{
			res.send('Incorrect name and password.')
		}
		res.end()
		})
	}else{
		res.send('Please enter valid username and password..')
		res.end();
	}
});

app.get('/tecnicos',(req,res)=>{
	let sql='SELECT * from tecnico'
	bd.execSQLQuery(sql,res);
});

app.get('/tecnicos/:id?',(req,res)=>{
	let filter='';
	if(req.params.id) filter='WHERE idTecnico='+parseInt(req.params.id)
		bd.execSQLQuery('SELECT * FROM tecnico '+filter,res);
})

app.delete('/servicos/:id',(req,res)=>{
	const update=parseInt(req.params.id)
	const query=bd.connection.query('DELETE FROM serviço WHERE idServiço=?',update,function(err,rows,fields){
		console.log(query.sql)

		if(!err){
			console.log("Database updated successfully.")
		}
		else
			console.log(err)
	});
	res.end();
})

app.get('/listTecnicos',(req,res)=>{
	res.sendFile(dirname+'/tecnicos.html')
});

app.get('/listServicos',(req,res)=>{
	if(req.session.loggedIn)
		res.sendFile(dirname+'/servicos.html')
	else
		res.send("Not allowed to go here, please login first..")
});

app.get('/regServico',(req,res)=>{
	console.log(req.session.loggedIn);
	if(req.session.loggedIn)
		res.sendFile(dirname+'/regServico.html')
	else
		res.send("Not allowed to go here, please login first..");
});

app.get('/servicos',(req,res)=>{
	let sql='SELECT * from serviço'
	bd.execSQLQuery(sql,res);
});

app.post('/regServico',(req,res)=>{
	console.log("POST",req.body.idTecnico)

	var id=req.body.idTecnico;
	var funcao=req.body.funcao;
	const post={descricao: funcao,idTecnico: id}
	let sql='INSERT INTO serviço SET ?'
	bd.connection.query(sql,post);
	res.status(200).send(req.body)
});

app.post('/', (req, res) => {
	var name=req.body.name;
	var desc=req.body.desc;
	const post={nome: name,funcao: desc};
	console.log(name,desc)
	let sql1='INSERT INTO tecnico SET ?'
	bd.connection.query(sql1,post);
	res.status(200).send(req.body)
});

app.listen(8080);
