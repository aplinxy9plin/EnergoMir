import React from 'react'
import { Button, Form, Grid, Image, Message, Segment, Input, Icon, Label } from 'semantic-ui-react'
import './MainPage.css'
import {Redirect} from 'react-router-dom'
import { csv } from 'd3-request';
import logo from '../img/logo.png'
import papaparse from 'papaparse'
import axios from 'axios'
class Update extends React.Component{
    constructor(props){
        super(props)
        this.state = {

        }
        this.onChange = this.onChange.bind(this)
        this.submit = this.submit.bind(this)
    } 
    componentDidMount(){
      var fieldMap = [];
      var mapFinish = 0;
      var nodes = [];
      var global = {};
      var ctx = null;
      var availableMoves = [
      	{ x: 0, y:-1 },	/* forward */
      	{ x:-1, y:-1 },	/* forward and left */
      	{ x:-1, y: 0 },	/* left */
      	{ x:-1, y: 1 },	/* back and left */
      	{ x: 0, y: 1 },	/* back */
      	{ x: 1, y: 1 },	/* back and right */
      	{ x: 1, y: 0 },	/* right */
      	{ x: 1, y:-1 }	/* forward and right */
      ];

      function rnd(min, max) { return min + Math.floor(Math.random() * (max - min)); }

      function buildNewMap() {
      	fieldMap = new Array(global.fH);
      	for (var h = 0; h < global.fH; h++) {
      		fieldMap[h] = new Array(global.fW);
      		for (var w = 0; w < global.fW; w++)
      			fieldMap[h][w] = 0;
      	}

      	var size = global.fW * global.fH;
      	mapFinish = rnd(size / 3, size / 5);
      }

      function buildNewNode(x, y) {
      	return {
      		pos: { x: x, y: y }, pre: { x: x, y: y },
      		stuckFactor: 0,
      		tailLength: 0,
      		turns: rnd(2, 5),
      		move: function() {
      			var moves = this.possibleMoves();
      			var curMove = moves[rnd(0, moves.length)];
      			var ox = this.pos.x;
      			var oy = this.pos.y;
      			var nx = this.pos.x + curMove.x;
      			var ny = this.pos.y + curMove.y;
      			this.stuckFactor -= 1;

      			if (nx < 0 || ny < 0 || nx > (global.w / global.s - 1) || ny > (global.h / global.s - 1)) return null;
      			if (fieldMap[ny][nx] == 1) return null;
      			if (ox != nx && oy != ny && fieldMap[ny][ox] == 1 && fieldMap[oy][nx] == 1) return null;

      			fieldMap[ny][nx] = 1;

      			this.stuckFactor += 2;
      			this.tailLength += 1;
      			this.turns += curMove.type == 't' ? -1 : 0;
      			this.pre = { x: ox, y: oy };
      			this.pos = { x: nx, y: ny };
      			return this.pos;
      		},
      		stuck: function() { return this.stuckFactor < -5; },
      		possibleMoves: function() {
      			var ax = this.pos.x - this.pre.x;
      			var ay = this.pos.y - this.pre.y;
      			if (ax == 0 && ay == 0) return [availableMoves[rnd(0, 7)]];

      			var index = -1;
      			for (var i = 0; i < availableMoves.length; i++) 
      				if (availableMoves[i].x == ax && availableMoves[i].y == ay) 
      					index = i;

      			var result = [availableMoves[index]];
      			if (this.turns > 0)
      			{
      				var lIndex = index == 0 ? availableMoves.length - 1 : index - 1;
      				var leftMove = availableMoves[lIndex];
      				leftMove.type = 't';
      				result.push(leftMove);

      				var rIndex = index == availableMoves.length - 1 ? 0 : index + 1;
      				var rightMove = availableMoves[rIndex];
      				rightMove.type = 't';
      				result.push(rightMove);
      			}

      			return result;
      		}
      	};
      }

      function init() {
      	global = { w: Math.min(1000, window.innerWidth), h: Math.min(500, window.innerHeight), s: 10 };
      	global.fW = Math.floor(global.w / global.s);
      	global.fH = Math.floor(global.h / global.s);

      	var canvas = document.getElementById('frame');
      	if (canvas.getContext) {
        		ctx = canvas.getContext('2d');
        		canvas.width = global.w;
        		canvas.height = global.h;

      		ctx.globalCompositeOperation = 'source-over';
      		ctx.lineWidth = 1;
        		ctx.strokeStyle = "#F1F90D";
      		ctx.fillStyle = "#F1F90D";
      	}

      	window.requestAnimationFrame(draw);
      }

      function getNotFilled() {
      	var open = [];
      	for (var i = 0; i < fieldMap.length; i++)
      		for (var j = 0; j < fieldMap[i].length; j++)
      			if (fieldMap[i][j] == 0) open.push({ x:j, y:i });
      	return open;
      }

      function rebuild(forceClear) {
      	var open = getNotFilled();
      	if (forceClear || open.length <= mapFinish) {
      		ctx.clearRect(0, 0, global.w, global.h);
      		buildNewMap();
      		nodes = [];
      	}

      	if (nodes.length < 10) {
      		var next = open[rnd(0, open.length)];
      		if (next != undefined) nodes.push(buildNewNode(next.x, next.y));
      	}
      }

      function draw() {
      	window.requestAnimationFrame(draw);
      	if (ctx == null) return;

      	rebuild(false);
      	
      	ctx.beginPath()
      	for (var i = 0; i < nodes.length; i++) {
      		var cur_p = nodes[i].pos;
      		var new_p = nodes[i].move();
      		var correct = global.s / 2;

      		if (new_p != null) {
      			ctx.moveTo(cur_p.x * global.s + correct, cur_p.y * global.s + correct);
      			ctx.lineTo(new_p.x * global.s + correct, new_p.y * global.s + correct);
      		}
      		
      		if (nodes[i].tailLength <= 1 || nodes[i].stuck()) {
      			var rad = global.s / 4;
      			ctx.moveTo(cur_p.x * global.s + rad + correct, cur_p.y * global.s + correct);
      			ctx.arc(cur_p.x * global.s + correct, cur_p.y * global.s + correct, rad, 0, 6.28);
      		}
      	}
      	ctx.stroke();
      	ctx.fill();
      	
      	var new_nodes = [];
      	for (var i = 0; i < nodes.length; i++)
      		if (!nodes[i].stuck())
      			new_nodes.push(nodes[i]);
      	nodes = new_nodes;
      }
      document.getElementById('frame').onclick = function(){rebuild(true)}
      // document.onclick = function() { rebuild(true); }
      init();
    }
    onChange(e){
      const { name, value } = e.currentTarget;
      this.setState({
        [name]: parseInt(value, 10)
      })
    }
    submit(){
        fetch('http://localhost:1337/upload_one', {
        headers: {
        	'Accept': 'application/json',
        	'Content-Type': 'application/json'
        },
        method: "POST", 
        body: JSON.stringify({
            gabariti: {
               inom: this.state.inom,
               l: this.state.l,
               h: this.state.h,
               diam: this.state.diam,
               weight: this.state.weight
            },
            reactor: {
                l: this.state.l,
                r: this.state.r,
                min: this.state.min,
                Max: this.state.Max,
                Dial: this.state.Dial
            }
        })})
        .then(response => response.json())
        .then(data => {
            if(data.type === 'ok'){
                alert('Успешно импортировано!')
                window.location.reload()
            }
        })
        // fetch('http://localhost:1337/upload_one', {
        //     method:'post',
        //     headers : { 
        //         'Content-Type': 'application/json',
        //         'Accept': 'application/json'
        //        },
        //     dataType: "json",
            
        //   })
        //   .then(response => response.json())
        //   .then(data => {
        //       console.log(data)
        //   });
    }
    loadFile = (e) => {
        var files = e.target.files;
        for (var i = 0, f; f = files[i]; i++) {
            console.log(files[i])
            // Only process image files.
      
            var reader = new FileReader();
      
            // Closure to capture the file information.
            reader.onload = (function(theFile) {
              return function(event) {
                  console.log(event.target.result)
                  var formData = new FormData();
                  console.log(e.target)
                  formData.append('file', event.target);
                  fetch('http://localhost:1337/upload', {
                    method:'POST',
                     body: formData
                  });
              };
            })(f);
      
            // Read in the image file as a data URL.
            reader.readAsDataURL(f);
          }
        
        function getAsText(fileToRead) {
            var reader = new FileReader();
            // Handle errors load
            reader.onload = loadHandler;
            reader.onerror = errorHandler;
            // Read file into memory as UTF-8      
            reader.readAsText(fileToRead);
        }
        
        function loadHandler(event) {
            var csv = event.target.result;
            processData(csv);             
        }
        
        function processData(csv) {
            var allTextLines = csv.split(/\r\n|\n/);
            var lines = [];
            while (allTextLines.length) {
                lines.push(allTextLines.shift().split(','));
            }
            console.log(lines);
            drawOutput(lines);
        }
        
        //if your csv file contains the column names as the first line
        function processDataAsObj(csv){
            var allTextLines = csv.split(/\r\n|\n/);
            var lines = [];
            
            //first line of csv
            var keys = allTextLines.shift().split(',');
            
            while (allTextLines.length) {
                var arr = allTextLines.shift().split(',');
                var obj = {};
                for(var i = 0; i < keys.length; i++){
                    obj[keys[i]] = arr[i];
            }
                lines.push(obj);
            }
                console.log(lines);
            drawOutputAsObj(lines);
        }
        
        function errorHandler(evt) {
            if(evt.target.error.name == "NotReadableError") {
                alert("Canno't read file !");
            }
        }
        
        function drawOutput(lines){
            console.log(lines)
            //Clear previous data
            // document.getElementById("output").innerHTML = "";
            // var table = document.createElement("table");
            // for (var i = 0; i < lines.length; i++) {
            //     var row = table.insertRow(-1);
            //     for (var j = 0; j < lines[i].length; j++) {
            //         var firstNameCell = row.insertCell(-1);
            //         firstNameCell.appendChild(document.createTextNode(lines[i][j]));
            //     }
            // }
            // // document.getElementById("output").appendChild(table);
        }
        
        //draw the table, if first line contains heading
        function drawOutputAsObj(lines){
            console.log(lines)
            //Clear previous data
            // document.getElementById("output").innerHTML = "";
            // var table = document.createElement("table");
            
            // //for the table headings
            // var tableHeader = table.insertRow(-1);
            //  Object.keys(lines[0]).forEach(function(key){
            //      var el = document.createElement("TH");
            //     el.innerHTML = key;		
            //     tableHeader.appendChild(el);
            // });	
            
            // //the data
            // for (var i = 0; i < lines.length; i++) {
            //     var row = table.insertRow(-1);
            //     Object.keys(lines[0]).forEach(function(key){
            //         var data = row.insertCell(-1);
            //         data.appendChild(document.createTextNode(lines[i][key]));
            //     });
            // }
            // document.getElementById("output").appendChild(table);
        }
        
        
    }
    handleFileUpload(e) {
        const file = e.currentTarget.files[0]
        // this.props.actions.uploadRequest({
        //    file,
        //    name: 'Awesome Cat Pic'
        // })
        let data = new FormData();
        data.append('file', file);
        data.append('name', 'file');
      
          axios.post('http://localhost:1337/upload_many', data)
            .then(response => {
                alert('Успешно импортировано!')
                window.location.reload()
            })
            // .catch(error => dispatch(uploadFail(error)))
      }
    render(){
        return(
            <div className='login-form'>
              <canvas id="frame">Canvas not supported by your browser</canvas>
                {/*
                  Heads up! The styles below are necessary for the correct render of this example.
                  You can do same with CSS, the main idea is that all the elements up to the `Grid`
                  below must have a height of 100%.
                */}
                <style>{`
                  body > div,
                  body > div > div,
                  body > div > div > div.login-form {
                    height: 100%;
                  }
                `}
                </style>
                <Grid textAlign='center' style={{ height: '100%' }} verticalAlign='middle'>
                  <Grid.Column style={{ maxWidth: 800 }}>
                    <Form size='large'>
                      <Segment stacked style={{paddingBottom: "80px"}}>
                      <Image src={logo} fluid />
                        <Input
                          onChange={this.onChange} 
                          type="text"
                          name="L"
                          fluid 
                          placeholder='l'
                        /> <br />
                        <Input
                          onChange={this.onChange} 
                          type="number"
                          name="r"
                          fluid 
                          placeholder='R'
                          labelPosition='right' 
                        /> <br />
                        <Input
                          onChange={this.onChange}
                          type="number" 
                          name="min"
                          fluid 
                          placeholder='Fmin'
                          labelPosition='right' 
                        /> <br />
                        <Input
                          onChange={this.onChange}
                          type="number" 
                          name="Max"
                          fluid 
                          placeholder='Fmax'
                          labelPosition='right' 
                        /> <br />
                        <Input
                          onChange={this.onChange}
                          type="number" 
                          name="Dial"
                          fluid 
                          placeholder='Предел'
                          labelPosition='right' 
                        /> <br />
                        <Input
                          onChange={this.onChange}
                          type="number" 
                          name="inom"
                          fluid 
                          placeholder='Inom'
                          labelPosition='right' 
                        /> <br />
                        <Input
                          onChange={this.onChange}
                          type="number" 
                          name="h"
                          fluid 
                          placeholder='H'
                          labelPosition='right' 
                        /> <br />
                        <Input
                          onChange={this.onChange}
                          type="number" 
                          name="diam"
                          fluid 
                          placeholder='Диаметр'
                          labelPosition='right' 
                        /> <br />
                        <Input
                          onChange={this.onChange}
                          type="number" 
                          name="weight"
                          fluid 
                          placeholder='Вес'
                          labelPosition='right' 
                        /> <br />

                        <Button onClick={this.submit} loading={this.state.loading} style={{background: "#032203", color: 'white'}} fluid size='large'>
                            Добавить новую запись
                        </Button> <br />
                        <input onChange={this.handleFileUpload} type="file" style={{display: 'none'}} class="inputfile" id="embedpollfileinput" />

                          <label for="embedpollfileinput" class="ui huge right floated button fluid">
                            <i class="ui upload icon"></i> 
                            Загрузить CSV
                          </label>
                        {
                          this.state.emptyErr && <Message color='red'>Введены не все поля.</Message>
                        }
                      </Segment>
                    </Form>
                    <Message>
                    <Button as='div' labelPosition='right'>
                      <Button color='blue'>
                        <Icon name='heart' />
                        <a style={{color: "white"}} target="_blank" href="https://www.instagram.com/p/BxniruknKM9/?igshid=1xkwh7u4ugxlu">Link</a>
                      </Button>
                      <Label as='a' basic color='green' pointing='left'>
                        2,048
                      </Label>
                    </Button>
                    </Message>
                  </Grid.Column>
                </Grid>
            </div>
        )
    }
}

export default Update
export function uploadSuccess({ data }) {
    return {
      type: 'UPLOAD_DOCUMENT_SUCCESS',
      data,
    };
  }
  
  export function uploadFail(error) {
    return {
      type: 'UPLOAD_DOCUMENT_FAIL',
      error,
    };
  }
  
  export function uploadDocumentRequest({ file, name }) {  
    let data = new FormData();
    data.append('file', document);
    data.append('name', name);
  
    return (dispatch) => {
      axios.post('http://localhost:1337/upload', data)
        .then(response => dispatch(uploadSuccess(response)))
        .catch(error => dispatch(uploadFail(error)))
    }
  }