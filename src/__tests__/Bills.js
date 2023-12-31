/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import '@testing-library/jest-dom';
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";

jest.mock("../app/store", () => mockStore);

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
      const billsInDescOrder = (a, b) => ((a.date < b.date) ? 1 : -1)
      const sortedBills = bills.sort(billsInDescOrder)
      document.body.innerHTML = BillsUI({ data: sortedBills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe('When I am on Bills page and I click on the new bill button', () => {
      test('Then I should navigate to newBill page', () => {
        const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) };
  
        const billsController = new Bills({
          document,
          onNavigate,
          store: null,
          bills: bills,
          localStorage: window.localStorage,
        });
  
        const newBillBtn = screen.getByTestId("btn-new-bill");
        const handleClickNewBill = jest.fn(billsController.handleClickNewBill);
        newBillBtn.addEventListener("click", handleClickNewBill);
        userEvent.click(newBillBtn);
  
        expect(handleClickNewBill).toHaveBeenCalled();
        expect(screen.getByTestId("form-new-bill")).toBeInTheDocument();
      });
    });

    describe("When I click on eye icon button", () => {
      test("Then the document modal should be displayed", () => {
        const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) };
        document.body.innerHTML = BillsUI({ data: bills });

        const billsController = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });

        const eyeIcons = screen.getAllByTestId('icon-eye');
        $.fn.modal = jest.fn()
        eyeIcons.forEach(icon => {
          const handleClickIconEye = jest.fn(billsController.handleClickIconEye(icon));
          icon.addEventListener('click', handleClickIconEye);
          userEvent.click(icon);
          expect(handleClickIconEye).toHaveBeenCalled();
        })
      });
    });
  })

  // test d'intégration GET
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "e@e" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      expect(screen.getByTestId("tbody")).toBeInTheDocument()
      expect(screen.getByTestId("btn-new-bill")).toBeInTheDocument()
      const rows = screen.getAllByTestId('icon-eye')
      rows.forEach((row) => expect(row).toBeInTheDocument())
    })
  })

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });

    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = screen.getByText(/Erreur 404/);
      expect(message).toBeInTheDocument();
    });

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = screen.getByText(/Erreur 500/);
      expect(message).toBeInTheDocument();
    });
  });
})
  
