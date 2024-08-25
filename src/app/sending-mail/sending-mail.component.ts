import { Component } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";

@Component({
    selector: 'app-sending-mail',
    standalone: true,
    templateUrl: './sending-mail.component.html',
    styleUrl: './sending-mail.component.css',
    imports: [HeaderComponent, FooterComponent]
})
export class SendingMailComponent {

}
