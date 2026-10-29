import { Component } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    this.showSplash(); //corre la funcion 
  }

  async showSplash(){
    await SplashScreen.show({
      autoHide: true,
      showDuration:3000
    });

  }
}
