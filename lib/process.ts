import net = require('net');
import request = require('request');
import stream = require('stream');

import { EventEmitter } from 'events';
import {LanguageServerProcess} from 'atom-languageclient';


export interface SessionDetails {
  port: number;
  socket: any;
}

class LanguageServerSessionDetails implements SessionDetails{
  port: number;
  socket: any;
}

// Create a "Process" as Atom-IDE expects
// However, the process must actually be launched seperately by the user
export class GodotServerProcess {
  private languageServerProcess: LanguageServerProcess;
  private sessionDetails: SessionDetails;
  
  constructor( ){
  }
  
  public start(logFileName: string): Promise<SessionDetails>{
    this.sessionDetails = new LanguageServerSessionDetails();
    return new Promise<LanguageServerSessionDetails>(
      (resolve, reject) => {
          this.connectToLanguageService().then(() => {
                this.languageServerProcess = this.createDummyLanguageServerProcess({});
                resolve(this.sessionDetails);
          });
      }
    );
  }
  
  private connectToLanguageService(){
    this.sessionDetails = new LanguageServerSessionDetails();
    return new Promise(
      (resolve, reject) => {
        const server = net.createServer(socket => {
          // When the language server connects, grab socket, stop listening 
          console.log(`Socket connected`)
          this.sessionDetails.socket = socket
          server.close();
          resolve();
        })
        server.listen(0, '127.0.0.1', () => {
          // Once we have a port assigned spawn the Language Server with the port
          const { port } = server.address() as net.AddressInfo
          this.sessionDetails.port = port;
          this.requestSocket(port);
        })
    });
  }
  
  private requestSocket(port: number){
    console.log(`Requesting socket on port: ${port}`)
    let json = {
      host: '127.0.0.1',
      port: port
    }
    
    //Post to port G-O-D-O-T
    request.post({
      uri: 'http://localhost:' + 46368,
      json: json
    }, (error: any, response: request.Response, body: any) => {
      if(error) {
        atom.notifications.addError('IDE-GDScript could not launch language server.', {
          dismissable: true,
          description: `Error ${error}`
        })        
      }
      else if(response.statusCode != 204) {
        atom.notifications.addError('IDE-GDScript could not negotiate a socket with the langauge server.', {
          dismissable: true,
          description: `Check that Godot is running with language server module compiled.`
        })        
      }      
    })
  }
  
  public getProcess(): LanguageServerProcess {
    return this.languageServerProcess;
  }

  private createDummyLanguageServerProcess(pty) {
    class DummyLanguageServerProcess extends EventEmitter implements LanguageServerProcess {
      public stdin: stream.Writable;
      public stdout: stream.Readable;
      public stderr: stream.Readable;
      public pid: number;

      constructor(private pty) {
        super();

        // Fake the stderr stream for now
        var Readable = require('stream').Readable;
        this.stderr = new Readable();
        this.stderr._read = function fake() {};

        //pty.on('exit', this.handleExit.bind(this));
        //pty.on('error', this.handleError.bind(this));
      }

      public kill(signal?: string): void {
        this.pty.kill(signal)
      }

      private handleExit(code: number, signal: string) {
        console.log(`godot language server ls exited with: code ${code}, signal ${signal}`)
        this.emit('exit', code, signal);
      }

      private handleError(err: Error) {
        console.log("godot language server exited due to an error:", err.toString());
        this.emit('error', err);
      }
    }
  console.log(`Creating psuedo language server process`);
  return new DummyLanguageServerProcess(pty);
}
  
}