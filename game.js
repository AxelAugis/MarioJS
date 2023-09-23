kaboom({
    global: true, 
    fullscreen: true,
    scale: 1,
    debug: true,
    clearColor: [0, 0, 0, 1],
})

const MOVE_SPEED = 120
const JUMP_FORCE= 360
const BIG_JUMP_FORCE = 550
let CURRENT_JUMP_FORCE = JUMP_FORCE
let isJumping = true
const FALL_DEATH = 400

loadRoot("sprites/")
loadSprite("coin", "coin.png")
loadSprite("evil-mushroom", "evil-mushroom.png")
loadSprite("brick", "brick.png")
loadSprite("block", "block.png")
loadSprite("mario", "mario.png")
loadSprite("mushroom", "mushroom.png")
loadSprite("surprise", "surprise.png")
loadSprite("unboxed", "unboxed.png")
loadSprite("pipe-top-left", "pipe-top-left.png")
loadSprite("pipe-top-right", "pipe-top-right.png")
loadSprite("pipe-bottom-left", "pipe-bottom-left.png")
loadSprite("pipe-bottom-right", "pipe-bottom-right.png")
loadSprite("blue-block", "blue-block.png")
loadSprite("blue-brick", "blue-brick.png")
loadSprite("blue-steel", "blue-steel.png")
loadSprite("blue-evil-mushroom", "blue-evil-mushroom.png")
loadSprite("blue-surprise", "blue-surprise.png")

scene("game", ( {level, score, lifes }) => {
    layers(["bg", "obj", "ui"], "obj")

    const maps = [ [
        '                                      ',
        '                                      ',
        '                                      ',
        '                                      ',
        '                                      ',
        '     %   =*=%=                        ',
        '                                      ',
        '                            -+        ',
        '                    ^   ^   ()        ',
        '==============================   =====',
     ],
     [
        '£                                       £',
        '£                                       £',
        '£                                       £',
        '£                                       £',
        '£                                       £',
        '£        @@@&@@              x x        £',
        '£                          x x x        £',
        '£                        x x x x  x   -+£',
        '£               z   z  x x x x x  x   ()£',
        '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!',
     ]
    ]

    // Defines the width and height of each sprite
    const levelCfg = {
        width: 20,
        height: 20,
        '=': [sprite('block'), solid()],
        '$':[sprite('coin'), 'coin'],
        '%':[sprite('surprise'), solid(), 'coin-surprise'],
        '*':[sprite('surprise'), solid(), 'mushroom-surprise'],
        '}':[sprite('unboxed'), solid()],
        '(':[sprite('pipe-bottom-left'), solid(), scale(0.5)],
        ')':[sprite('pipe-bottom-right'), solid(), scale(0.5)],
        '-':[sprite('pipe-top-left'), solid(), scale(0.5), 'pipe'],
        '+':[sprite('pipe-top-right'), solid(), scale(0.5), 'pipe'],
        '^':[sprite('evil-mushroom'), solid(), 'dangerous'],
        // Adding body to the mushroom, allow gravity to affect it
        '#':[sprite('mushroom'), solid(), 'mushroom', body()],
        '!':[sprite('blue-block'), solid(), scale(0.5)],
        '£':[sprite('blue-brick'), solid(), scale(0.5)],
        'z':[sprite('blue-evil-mushroom'), solid(), scale(0.5), 'dangerous'],
        '@':[sprite('blue-surprise'), solid(), scale(0.5), 'coin-surprise'],
        "&": [sprite('blue-surprise'), solid(), scale(0.5), 'mushroom-surprise'],
        'x':[sprite('blue-steel'), solid(), scale(0.5)],
    }

    const gameLevel= addLevel(maps[level], levelCfg)

    const scoreLabel = add([
        text('coins : ' + score, 10),
        pos(30, 6),
        layer('ui'),
        {
            value: score,
        }
    ])

    const lifeLabel = add([
        text('lifes: ' + lifes, 10), 
        pos(260,6),
        layer('ui'),
        {
            value: lifes
        },
    ])

    

    add([text('level ' + parseInt(level + 1), 10), pos(160,6)])

    function big() {
        let timer = 0
        let isBig = false
        return { 
            update()  {
                if(isBig) {
                    CURRENT_JUMP_FORCE = BIG_JUMP_FORCE
                    timer -= dt()
                    if(timer <=0) {
                        this.smallify()
                    }
                }
            },
            isBig(){
                return isBig
            }, 
            smallify() {
                CURRENT_JUMP_FORCE = JUMP_FORCE
                this.scale = vec2(1)
                timer = 0
                isBig = false
            },
            biggify(time){
                CURRENT_JUMP_FORCE = BIG_JUMP_FORCE
                this.scale = vec2(2)
                timer = time
                isBig = true
            }
        }
    }

    // Add the player to the game
    const player = add([
        sprite('mario'), solid(),
        pos(30, 0),
        body(),
        big(),
        origin('bot')
    ])

    action('mushroom', (m) => {
        m.move(50, 0)
    } ) 


    // Create interaction between player and coin or biggifying mushroom
    player.on("headbump", (obj) => {
        if(obj.is('coin-surprise')) {
            gameLevel.spawn('$', obj.gridPos.sub(0,1))
            destroy(obj)
            gameLevel.spawn('}', obj.gridPos.sub(0,0))
        }

        if(obj.is('mushroom-surprise')) {
            gameLevel.spawn('#', obj.gridPos.sub(0,1))
            destroy(obj)
            gameLevel.spawn('}', obj.gridPos.sub(0,0))
        }
    })

    player.collides('mushroom', (m)=> {
        destroy(m)
        player.biggify(6)
    })

    const ENEMY_SPEED = 20

    action('dangerous', (d) => {
        d.move(-ENEMY_SPEED, 0)
    })

    player.collides('coin', (c) => {
        destroy(c)
        scoreLabel.value ++
        scoreLabel.text = scoreLabel.value
    })

    player.collides('dangerous', (d) => {
        if(isJumping){
            destroy(d)
        } else if(lifeLabel.value > 1) {
            go('game', {
                level: level,
                score: scoreLabel.value,
                lifes: lifeLabel.value - 1
            })
        } else if (lifeLabel.value == 1) {
            go('lose', {score: scoreLabel.value})
        }
       
    })

    // Defines the camera position and when the player loses
    player.action(() => {
        camPos(player.pos)
        if(player.pos.y > FALL_DEATH && lifeLabel.value == 1) {
            go('lose', {score: scoreLabel.value})
        } else if (player.pos.y > FALL_DEATH) {
            go('game', {
                level: level,
                score: scoreLabel.value,
                lifes: lifeLabel.value - 1
            })
        }
    })

    player.collides('pipe', () => {
        keyPress('down', () => {
            go("game", {
                level: (level +1) % maps.length,
                score: scoreLabel.value
            })
        })
    })

    
    // Defines the movement of the player
    keyDown('left', () => {
        player.move(-MOVE_SPEED, 0)
    })

    keyDown('right', () => {
        player.move(MOVE_SPEED, 0)
    })

    player.action(() => {
        if(player.grounded()) {
            isJumping = false
        }
    })

    keyPress('space', () => {
        if(player.grounded()) {
            isJumping = true
            player.jump(CURRENT_JUMP_FORCE)
        }
    })
    
})

scene('lose', ({ score }) => {
    add([text('Your score is : ' + score, 32), origin('center'), pos(width()/2, height()/2)])
})

start("game", {level: 0, score: 0, lifes: 3});