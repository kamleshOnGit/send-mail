import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailDetailsComponentComponent } from './email-details.component';

describe('EmailDetailsComponentComponent', () => {
  let component: EmailDetailsComponentComponent;
  let fixture: ComponentFixture<EmailDetailsComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailDetailsComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmailDetailsComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
