import express, { request, response } from "express";
import mysql from "mysql";
import cors from "cors";


import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "express-session";


import jwt from "jsonwebtoken";


const app = express();
const port = 3001; //port de la bdd
const saltRound = 10 //for hash --> bcrypt

app.use(cors({ //link between the front and the back
    origin: ["http://localhost:3000"],
    method: ["GET", "POST"],
    credentials: true,
}));




const db = mysql.createConnection({  //request to connect to the database
    host: "localhost",
    user: "root",
    password: "root",
    database: "ninoloc"

})

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());

app.use(session({
    key : "userId",
    secret: "subscribe",  //very important change in production !!!
    saveUninitialized: true,
    resave: true,
    cookie:{
        expires : 60 * 60 * 24,
    }

}))

app.post('/register', (req, res) => {

    const username = req.body.username;
    const password = req.body.password;
    const mail = req.body.mail;
    const name = req.body.name;

    bcrypt.hash(password, saltRound, (err, hash) => {

        if (err){
            console.log(err)
        }

        db.query("INSERT INTO users (`username`, `password`, `mail`, `name`) VALUES (?,?,?,?)",
        [username, hash, mail, name],
        (err, result) => {
            console.log(err);

        }
    );
    })

    
});


const verifyJWT = (req, res, next) => {
 const token = req.headers['x-access-token'];
 if (!token) {
    res.send("il faut le token, ")
 }else {
    jwt.verify(token , "jwtSecret", (err, decoded) => {
        if (err){
            res.json({auth : false , message :"U failed to authenticate"})
        }else{
            req.userId = decoded.id;
            next()
        }
    });
 }
}



app.get('/isUserAuth', verifyJWT , (req, res) => {
    res.sendFile("authentication ok ")
})

app.get ("/login", (req, res) => {
    if (req.session.user) {
        res.send({loggedIn: true, user: req.session.user});
    }else{
        res.send({loggedIn: false});
    }
})
app.post("/login", (req, res) => {

    const password = req.body.password;
    const mail = req.body.mail;
    
    db.query(
        "SELECT * FROM users WHERE mail = ?",
        mail,
        (err, result) => {
            

            if (err) {
                res.send({err: err});
            }
                
                if (result.length > 0) {
                    const passwordhash = result[0].Password;
                    bcrypt.compare(password, passwordhash, (error, response) => {
                        if (response){
                            

                            const id = result[0].id;
                            const token = jwt.sign({id}, "jwtSecret", {
                                expiresIn: 300,
                            })

                            console.log(req.session.user);


                            res.json({auth : true , token : token, result : result});
                            
                        }else{
                            res.send ({message : "mauvais mdp/mail"})
                           
                            

                        }
                    });
                }else{
                    res.send ({message : "mauvais mdp/mail"})
                }
            
            }
    
    );
    
});


app.listen(port, () => {
    console.log("connected back end")
});















// Véhicule CRUD ----------------------------------------------------------------------------------------------
app.get("/", (req, res) => {
    res.json("hello ")
});

app.get("/vehicules", (req, res) => {    //consultation des véhicule via l'url /vehicules
    const q = "SELECT * FROM vehicule"   //requete SQL 
    db.query(q, (err, data) => {
        if (err) return res.json(err)
        return res.json(data)
    })
});


app.post("/vehicules/ajouter", (req, res) => {
    const q = "INSERT INTO vehicule (`Model`,`Annee_production`,`Carburant`,`Photos`,`Limite_age`,`Description`,`Categorie`,`Nombre_de_place`)VALUES (?)"
    const values = [req.body.Model, req.body.Annee_production, req.body.Carburant, req.body.Photos, req.body.Limite_age, req.body.Description, req.body.Categorie, req.body.Nombre_de_place]
    db.query(q, [values], (err, data) => {
        if (err) return res.json(err)
        return res.json("le véhicule viens d'être ajouté.")
    })
})

app.put("/vehicule/update/:id", (req, res) => {
    const vehiculeID = req.params.id;
    const q = "UPDATE vehicule SET `Model` = ?,`Annee_production` = ?,`Carburant` = ?,`Photos`= ?,`Limite_age`= ?,`Description`= ?,`Categorie`= ?,`Nombre_de_place`= ? WHERE id =? "
    const values = [req.body.Model, req.body.Annee_production, req.body.Carburant, req.body.Photos, req.body.Limite_age, req.body.Description, req.body.Categorie, req.body.Nombre_de_place]
    db.query(q, [...values, vehiculeID], (err, data) => {
        if (err) return res.json(err)
        return res.json("le véhicule viens d'être modifier.")
    })
})

app.delete("/vehicule/delete/:id", (req, res) => {
    const vehiculeID = req.params.id;
    const q = "DELETE FROM vehicle WHERE id = ?";
    db.query(q, [vehiculeID], (err, data) => {
        if (err) return res.json(err)
        return res.json("le véhicule viens d'être supprimer.")
    })
})


