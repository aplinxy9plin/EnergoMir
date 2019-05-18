import React from 'react'
import { Button, Form, Grid, Image, Message, Segment, Input, Icon, Label, Container } from 'semantic-ui-react'
import './MainPage.css'
import autocad from '../data/autocad.pdf'
class ResultPage extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            download_url: 'https://raw.githubusercontent.com/mjstest/orgb2/b7dcf8d318319fbc00b80d43de42c8c4/demka.dxf'
        }
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
    render(){
        console.log(this.props.location.state.id)
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
                  <Grid.Column style={{ maxWidth: "80%" }}>
                    <Segment>
                        <Container fluid>
                            <iframe style={{width: "100%", height: "700px", border: 'none'}} src={"http://localhost:1337/pdf/"+this.props.location.state.id} />
                            <Button primary><a style={{color: "white"}} downlod="filename" href={"http://localhost:1337/word/"+this.props.location.state.id}>Скачать Word File</a></Button>
                            <Button secondary><a style={{color: "white"}} downlod="filename" href={"http://localhost:1337/dxf/"+this.props.location.state.id}>Скачать DXF</a></Button>
                        </Container>
                    </Segment>
                    <Message>
                    <Button as='div' labelPosition='right'>
                      <Button color='blue'>
                        <Icon name='heart' />
                        Like
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

export default ResultPage