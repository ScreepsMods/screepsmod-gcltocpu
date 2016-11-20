/*
* Author: Clement Delalande (https://github.com/iKlem)
* Version: 0.2.0
*/

module.exports = (config) => {
  const constants = config.common.constants,
  storage = config.common.storage,
  cli = config.cli,
  engine = config.engine;

  let gclMult = 1,
  gclPow = 1,
  gclLevel = 1,
  newCPU = 0,
  oldUsers,
  doUpdate,
  updateUser;

  doUpdate = (forceUpdate = false) => {
    if (engine) {
      oldUsers = engine.driver.getAllUsers;

      engine.driver.getAllUsers = function() {
        var promise = oldUsers.apply(this, Array.prototype.slice.call(arguments));

        return promise.then(result => {
          for(let user of result) {
            if(!user.bot) {
              gclLevel = Math.floor(Math.pow((user.gcl || 0) / gclMult, 1 / gclPow)) + 1,
              newCPU = gclLevel * 10 + 20
              // TODO: Add check for errors
              if (!forceUpdate) {
                if (newCPU > user.cpu) {
                  updateUser(user, newCPU);
                }
              } else {
                updateUser(user, newCPU);
              }
            }
          }
          return result;
        });
      }
    }
  };

  updateUser = (user, cpu) => {
    if(storage) {
      console.log(`Updated maximum cpu to ${cpu} for user ${user.username}`);
      let retVal = storage.db.users.update({username: user.username}, {$set: {cpu: cpu}});
      if (retVal) {
        return true;
      }
    }
    return false;
  };

  if (constants) {
    gclMult = constants.GCL_MULTIPLY;
    gclPow = constants.GCL_POW;

    doUpdate();

    if (cli) {
      cli.on("cliSandbox", (sandbox) => {
        sandbox.updateCPU = (playerName = "") => {
          if (storage) {
            if (playerName != "") { // If a player name is given, update only for the player
              return storage.db.users.findOne({username: playerName}).then((user) => {
                if(user) {
                  gclLevel = Math.floor(Math.pow((user.gcl || 0) / gclMult, 1 / gclPow)) + 1,
                  newCPU = gclLevel * 10 + 20
                  sandbox.print(`Updating cpu for ${user.username} to ${newCPU}...`);
                  return updateUser(user, newCPU) ? "Done" : `Error updating cpu for ${user.username}!`;
                }
              });
            } else { // If no player name, update all players CPU
              sandbox.print(`Updating cpu for all users to their GCL...`);
              doUpdate(true);
              return "Update finished!";
            }
          }
        }
      });
    }
  }

};
