// Execute on command line
// case: 1 arg
// flow scripts execute src/flow/scripts/OmuseoScript.cdc \
// --arg String:"Stella"
//
// case: 2 args or more
// flow scripts execute src/flow/scripts/OmuseoScript.cdc \
// --args-json='[{"type": "String", "value": "Stella"}]'

import OmuseoContract from "./../contracts/OmuseoContract.cdc"

pub fun main(name: String): String {
  return OmuseoContract.sayHi(to: name)
}