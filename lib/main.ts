
import { GodotServerProcess } from './process';
import {AutoLanguageClient, ConnectionType, LanguageServerProcess} from 'atom-languageclient';

class GDScriptLanguageClient extends AutoLanguageClient { 
  
  private sessionSettings: any;
  private godotServerProcess: GodotServerProcess;
  
  getGrammarScopes(){ return ['source.gdscript']}
  getLanguageName(){ return 'GDScript' }
  getServerName(){ return 'GDScript-Language-Server'}
  getConnectionType(): ConnectionType { 
    return'socket';
  }
  
  async startServerProcess (projectPath: string): Promise<LanguageServerProcess> {    
    atom.config.observe('ide-gdscript', (settings) => this.sessionSettings = settings);
    
    return await this.negotiateServerSocket(projectPath);
  }
  
  
  private async negotiateServerSocket(projectPath: string): Promise<LanguageServerProcess> {
    this.godotServerProcess = new GodotServerProcess();
    let session = await this.godotServerProcess.start("EditorServices");
    this.socket = session.socket;
    return this.godotServerProcess.getProcess();
  }
  
}

atom.config.set('core.debugLSP', true)
module.exports = new GDScriptLanguageClient()