const express = require('express')
const aplicacion = express()
const mysql = require('mysql2')
const bodyParser = require('body-parser')

var pool = mysql.createPool({
  connectionLimit: 20,
  host: 'localhost',
  user: 'root',
  password: 'Lucas!2201',
  database: 'blog_viajes'
})

aplicacion.use(bodyParser.json())
aplicacion.use(bodyParser.urlencoded({ extended: true }))
aplicacion.set("view engine", "ejs")

// ---------------------------------------------------------------------------------------------------------------------------------------------------------


aplicacion.get('/api/v1/publicaciones/', (peticion, respuesta) => {
  pool.getConnection((err, connection) => {
    let consulta
    let modificadorConsulta = ""
    const busqueda = (peticion.query.busqueda) ? peticion.query.busqueda : ""
    const email = (peticion.params.email) ? peticion.params.email : ""
    const contrasena = (peticion.params.contrasena) ? peticion.params.contrasena : ""
    modificadorConsulta = `
    WHERE
    titulo LIKE '%${busqueda}%' OR
    resumen LIKE '%${busqueda}%' OR
    contenido LIKE '%${busqueda}%'
  `
    if (busqueda != "") {
      consulta = `
      SELECT *
      FROM publicaciones
      ${modificadorConsulta}
    `
    } else {
      consulta = `SELECT * FROM publicaciones`
    }

    connection.query(consulta, (error, filas, campos) => {
      if (filas.length > 0) {
        respuesta.json({
          data: filas
        })
      } else {
        respuesta.status(404)
        respuesta.send({
          errors: ["No se encuentra esa publicacion"]
        })
      }
    })
    connection.release()
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------------------


aplicacion.get('/api/v1/publicaciones/:id', (peticion, respuesta) => {
  pool.getConnection((err, connection) =>{
    const consulta =`
      SELECT *
      FROM publicaciones
      WHERE publicaciones.id =
      ${connection.escape(peticion.params.id)}
    `

    connection.query(consulta, (error, filas, campos) =>{
      if (filas.length > 0){
        respuesta.json({data: filas[0]})
      }
      else{
        respuesta.status(404)
        respuesta.send({
          errors: ["No se encuentra esa publicacion"]
        })
      }
      connection.release()
    })
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------------------

aplicacion.get('/api/v1/autores', function (peticion, respuesta) {
  pool.getConnection(function(err, connection) {
    const consulta = `
    SELECT *
    FROM autores
  `
    connection.query(consulta, function (error, filas, campos) {
      respuesta.json({data: filas})
    })

    connection.release()
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------------------


aplicacion.get('/api/v1/autores/:id', (peticion, respuesta) => {
  pool.getConnection((err, connection) =>{
    const consulta =`
      SELECT *
      FROM autores
      WHERE autores.id =
      ${connection.escape(peticion.params.id)}
    `

    connection.query(consulta, (error, filas, campos) =>{
      if (filas.length > 0){
        respuesta.json({data: filas[0]})
      }
      else{
        respuesta.status(404)
        respuesta.send({
          errors: ["No se encuentra esa publicacion"]
        })
      }
      connection.release()
    })
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------------------

aplicacion.post('/api/v1/autores', (peticion, respuesta) => {
  pool.getConnection((err, connection) => {
    const email = peticion.body.email.toLowerCase().trim()
    const pseudonimo = peticion.body.pseudonimo.trim()
    const contrasena = peticion.body.contrasena
    const consultaEmail = `
      SELECT *
      FROM autores
      WHERE email = ${connection.escape(email)}
    `
    connection.query(consultaEmail, (error, filas, campos) => {
      if(filas.length > 0){
        respuesta.status(404)
        respuesta.send({
          errors: ["Email duplicado"]
        })
     }
      else {
        const consultaPseudonimo = `
          SELECT *
          FROM autores
          WHERE pseudonimo = ${connection.escape(pseudonimo)}
        `
        connection.query(consultaPseudonimo, (error, filas, campos) => {
          if(filas.length > 0){
            respuesta.status(404)
            respuesta.send({
              errors: ["Pseudónimo duplicado"]
            })
          }
          else{
            const consulta = `
                          INSERT INTO
                          autores
                          (email, contrasena, pseudonimo)
                          VALUES (
                            ${connection.escape(email)},
                            ${connection.escape(contrasena)},
                            ${connection.escape(pseudonimo)}
                          )
                        `
            connection.query(consulta, function (error, filas, campos) {
              if (filas.length > 0){
                const id = filas.insertId
                const consultaId = `
                                    SELECT *
                                    FROM
                                    autores
                                    WHERE id = ${connection.escape(id)}
                                  `
                      connection.query(consultaId, (error, filas, campos) => {
                        respuesta.json({data: filas})
                      })
              }
              else{
                respuesta.status(404)
                respuesta.send({
                  errors: ["Error al insertar publicación"]
                })
              }
            })
         }
        })
      }
    })
    connection.release()
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------------------

aplicacion.post('/api/v1/publicaciones', (peticion, respuesta) => {
  pool.getConnection((err, connection) => {
    const email = peticion.query.email
    const contrasena = peticion.query.contrasena
    var consultaInsertar=""
    const consulta = `
        SELECT *
        FROM autores
        WHERE
        email = ${connection.escape(email)} AND
        contrasena = ${connection.escape(contrasena)}
        `

    connection.query(consulta, (error, filas, campos) =>{
      const date = new Date()
      const fecha = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
      const id = filas[0].id
      const titulo = peticion.body.titulo
      const resumen = peticion.body.resumen
      const contenido = peticion.body.contenido
      if(filas.length > 0){
        consultaInsertar =`
                  INSERT INTO
                  publicaciones
                  (titulo, resumen, contenido, autor_id, fecha_hora)
                  VALUES
                  (
                    ${connection.escape(peticion.body.titulo)},
                    ${connection.escape(peticion.body.resumen)},
                    ${connection.escape(peticion.body.contenido)},
                    ${connection.escape(id)},
                    ${connection.escape(fecha)}
        )
        `
      }
      else{
        respuesta.status(404)
        respuesta.send({
          errors: ["Error al publicar"]
        })
      }
      
    })
    connection.release()
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------------------

aplicacion.delete('/api/v1/autores/:id', (peticion, respuesta) => {
  pool.getConnection((err, connection) =>{
    const email = peticion.query.email
    const contrasena = peticion.query.contrasena
    var publicacion_id= peticion.params.id
    var autor_id = 0
    const consulta = `
                    SELECT *
                    FROM autores
                    WHERE
                    email = ${connection.escape(email)} AND
                    contrasena = ${connection.escape(contrasena)}
                    `

    connection.query(consulta, (error, filas, campos) =>{
      autor_id = filas[0].id
      if (filas.length > 0){
        consultaID=`
          DELETE FROM publicaciones
          WHERE autor_id = ${connection.escape(autor_id)} AND
          id = ${connection.escape(publicacion_id)}
        `
        connection.query(consultaID, (error, filas, campos) =>{
          console.log(filas)
        })
      }
      else{
        respuesta.status(404)
        respuesta.send({
          errors: ["Error al eliminar publicación"]
        })
      }
    })
    connection.release()
  })
})


aplicacion.listen(8080, function(){
  console.log("Servidor iniciado")
})

