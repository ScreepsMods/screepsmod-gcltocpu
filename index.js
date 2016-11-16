module.exports = (config) => {
  const constants = config.common.constants,
    engine = config.engine;

  let gclMult = 1,
    gclPow = 1,
    gclLevel = 1,
    newCPU = 0,
    oldUsers,
    storage;

  if (constants) {
    gclMult = constants.GCL_MULTIPLY;
    gclPow = constants.GCL_POW;

    if (engine) {
      oldUsers = engine.driver.getAllUsers;

      engine.driver.getAllUsers = function() {
        var promise = oldUsers.apply(this, Array.prototype.slice.call(arguments));

        return promise.then(result => {
          for(let user of result) {
            if(!user.bot) {
              gclLevel = Math.floor(Math.pow((user.gcl || 0) / gclMult, 1 / gclPow)) + 1,
              newCPU = gclLevel * 10 + 20
              if(newCPU > user.cpu) {
                storage = config.common.storage
                if(storage) {
                  console.log(`Updated maximum cpu to ${newCPU} for user ${user.username}`);
                  storage.db.users.update({username: user.username}, {$set: {cpu: newCPU}});
                }
              }
            }
          }

          return result;
        });
      }
    }
  }

};
