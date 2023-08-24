/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import '@testing-library/jest-dom';
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon).toHaveClass('active-icon')
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    // Jest - line 20 - NewBill click event
    describe('When I am on Bills page and I click on the new bill button', () => {
      test('Then I should navigate to newBill page', () => {
        // DOM construction
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
  
        // init bills display
        const billsContent = new Bills({
          document,
          onNavigate,
          store: null,
          bills: bills,
          localStorage: window.localStorage,
        });
  
        // handle click event
        const newBillBtn = screen.getByTestId("btn-new-bill");
        const handleClickNewBill = jest.fn(billsContent.handleClickNewBill);
        newBillBtn.addEventListener("click", handleClickNewBill);
        userEvent.click(newBillBtn);
  
        // expected results
        expect(handleClickNewBill).toHaveBeenCalled();
        expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      });
    });

    // 24 -27
    // handleClickIconEye = (icon) => {
    //   const billUrl = icon.getAttribute("data-bill-url")
    //   const imgWidth = Math.floor($('#modaleFile').width() * 0.5)
    //   $('#modaleFile').find(".modal-body").html(`<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`)
    //   $('#modaleFile').modal('show')
    // }

    //   36 - 55
    //   const bills = snapshot
    //   .map(doc => {
    //     try {
    //       return {
    //         ...doc,
    //         date: formatDate(doc.date),
    //         status: formatStatus(doc.status)
    //       }
    //     } catch(e) {
    //       // if for some reason, corrupted data was introduced, we manage here failing formatDate function
    //       // log the error and return unformatted date in that case
    //       console.log(e,'for',doc)
    //       return {
    //         ...doc,
    //         date: doc.date,
    //         status: formatStatus(doc.status)
    //       }
    //     }
    //   })
    // return bills
  })
})

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "e@e" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      expect(screen.getByText("Mes notes de frais"))
      expect(screen.getByTestId("tbody")).toBeTruthy()
      expect(screen.getByTestId("btn-new-bill")).toBeTruthy()
      const rows = screen.getAllByTestId('icon-eye')
      expect(rows).toBeInTheDocument
    })
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "e@e"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test('fetches bills from an API and fails with 404 message error', async () => {
      mockStore.get.mockImplementationOnce(() =>
        Promise.reject(new Error('Erreur 404'))
      );

      document.body.innerHTML = BillsUI({ error: 'Erreur 404' });
      const message = screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
            return Promise.reject(new Error("Erreur 500"))
        })
      document.body.innerHTML = BillsUI({ error: 'Erreur 500' });
      const message = screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
  })
})