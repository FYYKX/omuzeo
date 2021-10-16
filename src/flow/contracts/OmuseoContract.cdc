// Deploy on command line
// case 1: first time deploy
// flow project deploy
//
// case 2: nth time deploy
// flow project deploy --update

pub contract OmuseoContract {
  pub event IssuedGreeting(greeting: String)

  pub fun sayHi(to name: String): String {
    let greeting = "Hi, ".concat(name)

    emit IssuedGreeting(greeting: greeting)

    return greeting
  }

}